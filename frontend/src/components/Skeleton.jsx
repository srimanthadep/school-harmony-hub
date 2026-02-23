import React from 'react';
import './Skeleton.css';

const Skeleton = ({ width, height, borderRadius = '4px', style }) => {
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
