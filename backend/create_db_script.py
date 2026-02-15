import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from config.settings import settings

def create_database():
    # Connect to default 'postgres' database to create the new one
    # Parse the existing URL to get creds
    # database_url format: postgresql://user:password@host:port/dbname
    
    url = settings.DATABASE_URL
    # We need to strip the /avatar_db part and replace with /postgres
    base_url = url.rsplit('/', 1)[0]
    db_name = url.rsplit('/', 1)[1]
    
    try:
        # Manually parse for psycopg2 connection
        # Expected: postgresql://postgres:Blackdog@localhost:5432/avatar_db
        # This is a bit hacky but works for the specific format we know we have
        user_pass = url.split('@')[0].split('//')[1]
        user = user_pass.split(':')[0]
        password = user_pass.split(':')[1]
        host_port = url.split('@')[1].split('/')[0]
        host = host_port.split(':')[0]
        port = host_port.split(':')[1] if ':' in host_port else "5432"

        con = psycopg2.connect(
            dbname='postgres',
            user=user,
            host=host,
            password=password,
            port=port
        )
        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = con.cursor()
        
        # Check if exists
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{db_name}'")
        exists = cur.fetchone()
        
        if not exists:
            print(f"Creating database {db_name}...")
            cur.execute(f"CREATE DATABASE {db_name}")
            print("Database created successfully!")
        else:
            print(f"Database {db_name} already exists.")
            
        cur.close()
        con.close()
        
    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    create_database()
