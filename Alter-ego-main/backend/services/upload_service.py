import os
import shutil
from fastapi import UploadFile
from sqlalchemy.orm import Session
from uuid import uuid4

from utils.file_utils import save_temp_file, extract_zip, detect_file_type
from parsers.parser_factory import ParserFactory
from database import crud
from schemas.upload_schema import UploadResponse
from middleware.logger import logger
from websocket.connection_manager import manager
from websocket.events import WSMessage, UPLOAD_COMPLETE
from ai_engine.pinecone_client import pinecone_client

async def process_upload(file: UploadFile, db: Session) -> UploadResponse:
    temp_zip_path = None
    extracted_path = None
    
    try:
        # 0. Cleanup Old Data (Fresh Start)
        logger.info("Clearing old data for fresh upload...")
        crud.clear_all_data(db)
        pinecone_client.clear_index()
        logger.info("Old data cleared.")

        # 1. Save Upload
        temp_zip_path = save_temp_file(file, file.filename)
        file_size = os.path.getsize(temp_zip_path)
        logger.info(f"File saved to {temp_zip_path}, size: {file_size}")

        # 2. Extract
        extracted_path = extract_zip(temp_zip_path)
        logger.info(f"File extracted to {extracted_path}")

        # 3. Detect Type
        file_type = detect_file_type(extracted_path)
        logger.info(f"Detected file type: {file_type}")

        # 4. Create Metadata Record
        metadata = crud.create_upload_metadata(db, file.filename, file_size)

        # 5. Parse
        parser = ParserFactory.get_parser(file_type)
        parsed_posts = parser.parse(extracted_path)
        logger.info(f"Parser returned {len(parsed_posts)} posts")
        
        # 6. Deduplicate & Insert
        new_count = 0
        skipped_count = 0
        
        for post_data in parsed_posts:
            existing = crud.get_post_by_hash(db, post_data["content_hash"])
            if existing:
                skipped_count += 1
            else:
                crud.create_post(db, post_data)
                new_count += 1
                
        # 7. Update Metadata
        crud.update_upload_metadata(db, metadata.id, 
                                    total_posts_in_file=len(parsed_posts),
                                    posts_successfully_parsed=new_count,
                                    posts_skipped=skipped_count,
                                    upload_status='completed')
        
        # 8. Notify WebSocket
        stats = {
            "posts_parsed": new_count,
            "posts_skipped": skipped_count,
            "total_found": len(parsed_posts)
        }
        await manager.broadcast(WSMessage(type=UPLOAD_COMPLETE, data=stats))

        return UploadResponse(
            success=True,
            message=f"Successfully processed {new_count} new posts.",
            data=stats
        )

    except Exception as e:
        logger.error(f"Upload processing failed: {e}", exc_info=True)
        if 'metadata' in locals():
             crud.update_upload_metadata(db, metadata.id, upload_status='failed')
        raise e
        
    finally:
        # Cleanup
        if temp_zip_path and os.path.exists(temp_zip_path):
            os.remove(temp_zip_path)
        if extracted_path and os.path.exists(extracted_path):
            try:
                shutil.rmtree(extracted_path)
            except Exception:
                pass
