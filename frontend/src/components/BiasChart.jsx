import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle } from 'lucide-react';

const BiasChart = ({ data }) => {
    // Expect data format based on new requirements:
    // Narcissism, Empathy, Impulse, Deception, Validation, Aggression

    const formattedData = data.map(item => ({
        subject: item.name,
        A: item.score,
        fullMark: 100
    }));

    return (
        <div className="w-full h-full min-h-[300px] font-mono text-xs relative bg-black/40 rounded-xl border border-neutral-800 p-4">

            {/* Header */}
            <div className="flex items-center gap-2 mb-4 text-[#00FFFF] border-b border-[#00FFFF]/20 pb-2">
                <AlertTriangle size={14} />
                <h3 className="text-sm font-bold tracking-widest uppercase">BIAS MAP</h3>
            </div>

            <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={formattedData}>
                        {/* Hexagonal Grid would be ideal but Recharts PolarGrid is Spider (Polygon) by default which matches hexagon if 6 points */}
                        <PolarGrid stroke="#004d4d" />

                        <PolarAngleAxis
                            dataKey="subject"
                            stroke="#008080"
                            tick={{ fill: '#808080', fontSize: 10, fontFamily: 'monospace' }}
                        />

                        <Radar
                            name="Bias Profile"
                            dataKey="A"
                            stroke="#00FFFF"
                            strokeWidth={2}
                            fill="#00FFFF"
                            fillOpacity={0.2}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#000',
                                border: '1px solid #00FFFF',
                                color: '#00FFFF',
                                fontFamily: 'monospace'
                            }}
                            itemStyle={{ color: '#00FFFF' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Aesthetic Corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00FFFF]/50 rounded-tl-sm"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00FFFF]/50 rounded-tr-sm"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00FFFF]/50 rounded-bl-sm"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00FFFF]/50 rounded-br-sm"></div>
        </div>
    );
};

export default BiasChart;
