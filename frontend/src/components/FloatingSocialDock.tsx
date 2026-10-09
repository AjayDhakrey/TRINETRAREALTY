import React from 'react';
import { WhatsAppIcon, InstagramIcon, FacebookIcon } from './SocialIcons';

interface SocialLink {
  name: string;
  href: string;
  ariaLabel: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  hoverRotateClass: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/trinetrarealty_?stkn=MW52OXVra2cxcXhmaw==',
    ariaLabel: 'Follow Trinetra Realty on Instagram',
    title: 'Follow Trinetra Realty on Instagram (@trinetrarealty_)',
    icon: InstagramIcon,
    bgClass: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
    hoverRotateClass: 'group-hover:rotate-6',
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/share/1VBsJ1bSHk/',
    ariaLabel: 'Visit Trinetra Realty on Facebook',
    title: 'Visit Trinetra Realty on Facebook',
    icon: FacebookIcon,
    bgClass: 'bg-[#1877F2] hover:bg-[#166fe5]',
    hoverRotateClass: 'group-hover:rotate-6',
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/919186221008?text=Hello%2C%20I%20am%20interested%20in%20Trinetra%20Realty%20properties.',
    ariaLabel: 'Chat with Trinetra Realty on WhatsApp',
    title: 'Chat with Trinetra Realty on WhatsApp (+91 9186221008)',
    icon: WhatsAppIcon,
    bgClass: 'bg-[#25D366] hover:bg-[#20bd5a]',
    hoverRotateClass: 'group-hover:rotate-12',
  },
];

export const FloatingSocialDock: React.FC = () => {
  return (
    <aside
      aria-label="Social Media Quick Links"
      className="fixed left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-start gap-2.5 sm:gap-3 pointer-events-auto select-none"
    >
      {SOCIAL_LINKS.map((item) => {
        const IconComponent = item.icon;
        return (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.ariaLabel}
            title={item.title}
            className={`group flex items-center h-10 sm:h-11 rounded-full text-white shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 ease-out cursor-pointer overflow-hidden ${item.bgClass}`}
          >
            {/* Social Icon */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
              <IconComponent
                className={`w-4 h-4 sm:w-5 sm:h-5 text-white transition-transform duration-300 ${item.hoverRotateClass}`}
              />
            </div>

            {/* Social Name - collapsed to icon only, animates open on hover */}
            <span className="max-w-0 opacity-0 -translate-x-2 group-hover:max-w-40 group-hover:opacity-100 group-hover:translate-x-0 group-hover:pr-3.5 sm:group-hover:pr-4 group-hover:pl-0.5 overflow-hidden whitespace-nowrap text-xs font-semibold tracking-wide transition-all duration-300 ease-out select-none">
              {item.name}
            </span>
          </a>
        );
      })}
    </aside>
  );
};
