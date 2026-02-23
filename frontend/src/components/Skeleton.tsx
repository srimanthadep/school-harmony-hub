import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    style?: React.CSSProperties;
}

const Skeleton = ({ width, height, borderRadius = '4px', style }: SkeletonProps) => {
    return (
        <div
            className="skeleton-box"
            style={{
                width: width || '100%',
                height: height || '20px',
                borderRadius: borderRadius,
                ...style
            }}
        />
    );
};

export default Skeleton;
