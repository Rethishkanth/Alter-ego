import React from 'react';

const InsightCard = ({ title, value, description, icon: Icon, color = "text-primary" }) => {
    return (
        <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
                    <h3 className="text-2xl font-bold">{value}</h3>
                </div>
                {Icon && (
                    <div className={`p-2 rounded-lg bg-neutral-800 ${color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
            {description && <p className="text-sm text-neutral-400">{description}</p>}
        </div>
    );
};

export default InsightCard;
