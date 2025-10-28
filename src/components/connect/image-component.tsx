'use client';

import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useState } from 'react';

type TImageComponent = {
  width?: number;
  height?: number;
  src: string;
  alt?: string;
  style?: object;
  className?: string;
  fill?: boolean;
};

export default function ImageComponent({
  width,
  height,
  src = '',
  alt = '',
  className = '',
  fill = false
}: TImageComponent): React.ReactNode {
  const [loading, setLoading] = useState(true);

  const onImageLoad = () => {
    setLoading(false);
  };

  // {property.fileUrls.length >= 1 ? (
  //   <Image
  //     src={property.fileUrls[0]}
  //     alt={property.property_name}
  //     width={320}
  //     height={255}
  //     priority
  //     className="rounded-t-lg"
  //   />
  // ) : (
  //   <div className="flex h-[255px] w-full items-center justify-center rounded-t-lg bg-[#4E4E4E]/[0.10] text-primary/50">
  //     <ImageIcon size={130} />
  //   </div>
  // )}

  return (
    <>
      {loading && (
        <div
          className={cn(
            'flex animate-pulse items-center justify-center bg-[#4E4E4E]/[0.10] text-primary/50',
            className
          )}
          style={{
            width: fill ? '100%' : width,
            height: fill ? '100%' : height
          }}
        >
          <ImageIcon size={130} />
        </div>
      )}
      <Image
        onLoad={onImageLoad}
        src={src}
        width={width}
        height={height}
        alt={alt}
        className={cn('object-cover', className)}
        fill={fill}
        style={{ opacity: loading ? 0 : 100 }}
      />
    </>
  );
}
