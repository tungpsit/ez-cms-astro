'use client';

import type { PageElement, TextElement, HeadingElement, ImageElement, ButtonElement, DividerElement, SpacerElement, HtmlElement, VideoElement, IconElement, CtaElement, IconListElement, StatsElement, TestimonialElement, MapElement, CardElement } from '../../../lib/page-builder/types';
import { ArrowRight, Sparkles, ListChecks, Activity, Quote, Star as StarIcon, ShieldCheck, Layers, Megaphone, MapPin, Layout as LayoutIcon } from 'lucide-react';

const iconDictionary: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  'list-checks': ListChecks,
  activity: Activity,
  'shield-check': ShieldCheck,
  layers: Layers,
  megaphone: Megaphone,
  'map-pin': MapPin,
  layout: LayoutIcon,
};

interface BasicElementRendererProps {
  element: PageElement;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isPreview: boolean;
}

export function BasicElementRenderer({
  element,
  isSelected,
  onSelect,
  onDelete,
  isPreview,
}: BasicElementRendererProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const wrapperClass = isPreview
    ? ''
    : `relative transition-all ${isSelected ? 'ring-2 ring-emerald-500 ring-offset-2' : 'hover:ring-1 hover:ring-slate-300'}`;

  const renderElement = () => {
    switch (element.type) {
      case 'text':
        return <TextRenderer element={element as TextElement} />;
      case 'heading':
        return <HeadingRenderer element={element as HeadingElement} />;
      case 'image':
        return <ImageRenderer element={element as ImageElement} />;
      case 'button':
        return <ButtonRenderer element={element as ButtonElement} isPreview={isPreview} />;
      case 'divider':
        return <DividerRenderer element={element as DividerElement} />;
      case 'spacer':
        return <SpacerRenderer element={element as SpacerElement} isPreview={isPreview} />;
      case 'html':
        return <HtmlRenderer element={element as HtmlElement} />;
      case 'video':
        return <VideoRenderer element={element as VideoElement} />;
      case 'icon':
        return <IconRenderer element={element as IconElement} />;
      case 'cta':
        return <CtaRenderer element={element as CtaElement} isPreview={isPreview} />;
      case 'icon-list':
        return <IconListRenderer element={element as IconListElement} />;
      case 'stats':
        return <StatsRenderer element={element as StatsElement} />;
      case 'testimonial':
        return <TestimonialRenderer element={element as TestimonialElement} />;
      case 'map':
        return <MapRenderer element={element as MapElement} />;
      case 'card':
        return <CardRenderer element={element as CardElement} isPreview={isPreview} />;
      default:
        return <div className="text-slate-400 text-sm">Unknown element</div>;
    }
  };

  if (isPreview) {
    return renderElement();
  }

  return (
    <div onClick={handleClick} className={wrapperClass}>
      {renderElement()}
    </div>
  );
}

function TextRenderer({ element }: { element: TextElement }) {
  const style: React.CSSProperties = {
    color: element.style?.color,
    textAlign: element.style?.textAlign,
    fontSize: element.style?.fontSize,
    lineHeight: element.style?.lineHeight,
    padding: element.style?.padding,
    margin: element.style?.margin,
  };

  return (
    <div
      style={style}
      className="prose prose-slate max-w-none"
      dangerouslySetInnerHTML={{ __html: element.content }}
    />
  );
}

function HeadingRenderer({ element }: { element: HeadingElement }) {
  const Tag = element.settings.level;
  const style: React.CSSProperties = {
    color: element.style?.color,
    textAlign: element.style?.textAlign,
    fontSize: element.style?.fontSize,
    fontWeight: element.style?.fontWeight || 'bold',
    lineHeight: element.style?.lineHeight,
    margin: element.style?.margin || '0',
  };

  const sizeClasses = {
    h1: 'text-4xl',
    h2: 'text-3xl',
    h3: 'text-2xl',
    h4: 'text-xl',
    h5: 'text-lg',
    h6: 'text-base',
  };

  return (
    <Tag style={style} className={`${sizeClasses[element.settings.level]} font-bold text-slate-900`}>
      {element.content}
    </Tag>
  );
}

function ImageRenderer({ element }: { element: ImageElement }) {
  const style: React.CSSProperties = {
    width: element.style?.width || '100%',
    height: element.style?.height || 'auto',
    maxWidth: element.style?.maxWidth,
    objectFit: element.settings.objectFit,
    borderRadius: element.style?.borderRadius,
    margin: element.style?.margin,
  };

  if (!element.settings.src) {
    return (
      <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
        <div className="text-slate-400 text-sm">No image selected</div>
        <div className="text-slate-300 text-xs mt-1">Add image URL in settings</div>
      </div>
    );
  }

  const img = <img src={element.settings.src} alt={element.settings.alt} style={style} />;

  if (element.settings.link) {
    return (
      <a href={element.settings.link} target={element.settings.linkTarget}>
        {img}
      </a>
    );
  }

  return img;
}

function ButtonRenderer({ element, isPreview }: { element: ButtonElement; isPreview: boolean }) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors rounded-lg';
  
  const variantClasses = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600',
    secondary: 'bg-slate-600 text-white hover:bg-slate-700',
    outline: 'border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50',
    ghost: 'text-emerald-600 hover:bg-emerald-50',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const style: React.CSSProperties = {
    backgroundColor: element.style?.backgroundColor,
    color: element.style?.color,
    borderRadius: element.style?.borderRadius,
    margin: element.style?.margin,
  };

  const className = `${baseClasses} ${variantClasses[element.settings.variant]} ${sizeClasses[element.settings.size]}`;

  if (isPreview) {
    return (
      <a href={element.settings.link} target={element.settings.linkTarget} className={className} style={style}>
        {element.content}
      </a>
    );
  }

  return (
    <button className={className} style={style}>
      {element.content}
    </button>
  );
}

function DividerRenderer({ element }: { element: DividerElement }) {
  const style: React.CSSProperties = {
    borderTop: `${element.settings.thickness} ${element.settings.style} ${element.settings.color}`,
    margin: element.style?.margin || '16px 0',
  };

  return <hr style={style} />;
}

function SpacerRenderer({ element, isPreview }: { element: SpacerElement; isPreview: boolean }) {
  const style: React.CSSProperties = {
    height: element.settings.height,
  };

  if (isPreview) {
    return <div style={style} />;
  }

  return (
    <div style={style} className="bg-slate-100 border border-dashed border-slate-300 rounded flex items-center justify-center">
      <span className="text-slate-400 text-xs">{element.settings.height}</span>
    </div>
  );
}

function HtmlRenderer({ element }: { element: HtmlElement }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: element.content }} />
  );
}

function VideoRenderer({ element }: { element: VideoElement }) {
  const getEmbedUrl = () => {
    const { src, type } = element.settings;
    if (!src) return null;

    if (type === 'youtube') {
      const videoId = src.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&?\s]+)/)?.[1];
      if (videoId) {
        const params = new URLSearchParams();
        if (element.settings.autoplay) params.set('autoplay', '1');
        if (element.settings.muted) params.set('mute', '1');
        if (element.settings.loop) params.set('loop', '1');
        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
      }
    }

    if (type === 'vimeo') {
      const videoId = src.match(/vimeo\.com\/(\d+)/)?.[1];
      if (videoId) {
        const params = new URLSearchParams();
        if (element.settings.autoplay) params.set('autoplay', '1');
        if (element.settings.muted) params.set('muted', '1');
        if (element.settings.loop) params.set('loop', '1');
        return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
      }
    }

    return src;
  };

  const embedUrl = getEmbedUrl();

  if (!embedUrl) {
    return (
      <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
        <div className="text-slate-400 text-sm">No video URL</div>
        <div className="text-slate-300 text-xs mt-1">Add video URL in settings</div>
      </div>
    );
  }

  if (element.settings.type === 'self-hosted') {
    return (
      <video
        src={embedUrl}
        poster={element.settings.poster}
        autoPlay={element.settings.autoplay}
        muted={element.settings.muted}
        loop={element.settings.loop}
        controls={element.settings.controls}
        className="w-full rounded-lg"
        style={{
          maxWidth: element.style?.maxWidth,
          borderRadius: element.style?.borderRadius,
        }}
      />
    );
  }

  return (
    <div className="aspect-video">
      <iframe
        src={embedUrl}
        className="w-full h-full rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          borderRadius: element.style?.borderRadius,
        }}
      />
    </div>
  );
}

function IconRenderer({ element }: { element: IconElement }) {
  const style: React.CSSProperties = {
    width: element.settings.size,
    height: element.settings.size,
    color: element.settings.color,
    margin: element.style?.margin,
  };

  return (
    <svg style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function CtaRenderer({ element, isPreview }: { element: CtaElement; isPreview: boolean }) {
  const alignment = element.settings.alignment === 'center' ? 'items-center text-center' : 'items-start text-left';
  const layout = element.settings.layout === 'inline' ? 'gap-6 md:flex md:items-center md:justify-between' : 'gap-6';
  const variantClasses: Record<string, string> = {
    primary: 'bg-white text-slate-900 hover:bg-slate-100',
    secondary: 'bg-slate-800 text-white hover:bg-slate-700',
    outline: 'border border-white/60 text-white hover:border-white',
  };
  const button = (
    <span className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition-colors ${variantClasses[element.settings.buttonVariant]}`}>
      {element.settings.buttonText}
      <ArrowRight className="w-4 h-4 ml-2" />
    </span>
  );
  const style: React.CSSProperties = {
    backgroundColor: element.style?.backgroundColor,
    color: element.style?.color,
    padding: element.style?.padding,
    margin: element.style?.margin,
    borderRadius: element.style?.borderRadius,
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-emerald-500/30 via-cyan-500/20 to-blue-500/20"
      style={style}
    >
      <div className={`flex flex-col ${alignment} ${layout} p-8 backdrop-blur-sm`}>
        <span className="text-xs uppercase tracking-[0.3em] text-emerald-200">{element.settings.eyebrow}</span>
        <div>
          <h3 className="text-3xl font-semibold text-white mb-3">{element.settings.heading}</h3>
          <p className="text-slate-200 max-w-2xl">{element.settings.subheading}</p>
        </div>
        {isPreview ? (
          <a href={element.settings.buttonLink} target={element.settings.buttonTarget} className="inline-flex">
            {button}
          </a>
        ) : (
          <button type="button" className="inline-flex">
            {button}
          </button>
        )}
      </div>
    </div>
  );
}

function IconListRenderer({ element }: { element: IconListElement }) {
  const columns = Math.max(1, element.settings.columns);
  const containerStyle: React.CSSProperties = {
    backgroundColor: element.style?.backgroundColor,
    padding: element.style?.padding,
    margin: element.style?.margin,
    borderRadius: element.style?.borderRadius,
  };
  const blockBase = element.settings.showDividers ? 'border border-slate-200' : 'border border-transparent shadow-sm';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg" style={containerStyle}>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {element.settings.items.map(item => {
          const Icon = iconDictionary[item.icon] || Sparkles;
          const layout = element.settings.layout === 'horizontal' ? 'flex-row items-center gap-4' : 'flex-col gap-3';
          return (
            <div key={item.id} className={`flex rounded-xl bg-slate-50/80 p-4 ${layout} ${blockBase}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <Icon className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{item.title}</p>
                {item.description && <p className="mt-1 text-slate-500">{item.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatsRenderer({ element }: { element: StatsElement }) {
  const columns = Math.max(1, element.settings.columns);
  const containerStyle: React.CSSProperties = {
    backgroundColor: element.style?.backgroundColor,
    padding: element.style?.padding,
    margin: element.style?.margin,
    borderRadius: element.style?.borderRadius,
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg" style={containerStyle}>
      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {element.settings.items.map(item => (
          <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-3xl font-semibold" style={{ color: element.settings.accentColor }}>{item.value}</p>
            <p className="text-sm font-medium text-slate-600">{item.label}</p>
            {item.subtext && <p className="text-xs text-slate-400 mt-1">{item.subtext}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialRenderer({ element }: { element: TestimonialElement }) {
  const initials = element.settings.author.split(' ').map(part => part[0]).slice(0, 2).join('');
  const style: React.CSSProperties = {
    backgroundColor: element.style?.backgroundColor,
    padding: element.style?.padding,
    margin: element.style?.margin,
    borderRadius: element.style?.borderRadius,
  };
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl" style={style}>
      {element.settings.highlight && (
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">{element.settings.highlight}</p>
      )}
      <Quote className="absolute -top-4 -right-4 h-32 w-32 text-slate-100" />
      <p className="relative z-10 text-lg text-slate-700">{element.settings.quote}</p>
      <div className="mt-6 flex items-center gap-4">
        {element.settings.avatar ? (
          <img src={element.settings.avatar} alt={element.settings.author} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
        )}
        <div>
          <p className="font-semibold text-slate-900">{element.settings.author}</p>
          <p className="text-sm text-slate-500">{element.settings.role}</p>
          {element.settings.rating > 0 && (
            <div className="mt-1 flex gap-1">
              {Array.from({ length: element.settings.rating }).map((_, index) => (
                <StarIcon key={index} className="h-4 w-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MapRenderer({ element }: { element: MapElement }) {
  const address = encodeURIComponent(element.settings.address);
  const src = `https://maps.google.com/maps?q=${address}&t=&z=${element.settings.zoom}&ie=UTF8&iwloc=&output=embed`;
  
  const style: React.CSSProperties = {
    height: element.settings.height,
    borderRadius: element.style?.borderRadius,
    width: '100%',
    ...element.style,
  };

  return (
    <div style={style} className="overflow-hidden rounded-lg bg-slate-100">
      <iframe
        src={src}
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 0 }}
        allowFullScreen
      />
    </div>
  );
}

function CardRenderer({ element, isPreview }: { element: CardElement; isPreview: boolean }) {
  const isHorizontal = element.settings.layout === 'horizontal';
  
  const containerStyle: React.CSSProperties = {
    backgroundColor: element.style?.backgroundColor || '#ffffff',
    borderRadius: element.style?.borderRadius || '0.75rem',
    boxShadow: element.style?.boxShadow || '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    borderWidth: element.style?.borderWidth,
    borderColor: element.style?.borderColor,
    borderStyle: element.style?.borderStyle,
    ...element.style,
  };

  return (
    <div 
      className={`overflow-hidden ${isHorizontal ? 'flex items-center' : 'flex flex-col'}`}
      style={containerStyle}
    >
      {element.settings.image ? (
        <div className={`relative ${isHorizontal ? 'w-1/3 min-h-[200px]' : 'w-full h-48'}`}>
          <img 
            src={element.settings.image} 
            alt={element.settings.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className={`bg-slate-100 flex items-center justify-center ${isHorizontal ? 'w-1/3 min-h-[200px]' : 'w-full h-48'}`}>
          <LayoutIcon className="w-8 h-8 text-slate-300" />
        </div>
      )}
      
      <div className={`flex-1 p-6 ${isHorizontal ? '' : ''}`}>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">{element.settings.title}</h3>
        <p className="text-slate-600 mb-4">{element.settings.description}</p>
        
        {element.settings.buttonText && (
          isPreview ? (
            <a 
              href={element.settings.buttonLink}
              className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              {element.settings.buttonText}
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          ) : (
            <button className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700">
              {element.settings.buttonText}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          )
        )}
      </div>
    </div>
  );
}