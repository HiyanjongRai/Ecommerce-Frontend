import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  MapPin, 
  Phone, 
  Mail, 
  Clock 
} from 'lucide-react';

export default function Footer({ isVerdant = false }) {
  const accentColor = isVerdant ? 'text-moss' : 'text-green-400';
  const hoverColor = isVerdant ? 'hover:text-moss' : 'hover:text-green-400';
  const ctaBg = isVerdant ? 'bg-moss text-linen' : 'bg-green-600 text-white';

  return (
    <footer className="bg-neutral-900 text-gray-400 text-xs mt-16">
      
      {/* GET IN TOUCH RIBBON */}
      <div className={`py-8 px-4 sm:px-6 ${ctaBg}`}>
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-lg font-black uppercase tracking-wider">Get in Touch With Us</h4>
            <p className={`text-xs mt-1 ${isVerdant ? 'text-sage' : 'text-green-100'}`}>
              Have questions or need support? Our team is here to help you 24/7.
            </p>
          </div>
          <Link
            to="/contact"
            className={`font-extrabold px-8 py-3.5 rounded-full uppercase tracking-widest transition-colors shadow-lg whitespace-nowrap ${
              isVerdant 
                ? 'bg-forest-black hover:bg-linen hover:text-forest-black text-linen' 
                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
            }`}
          >
            Contact Support ΓåÆ
          </Link>
        </div>
      </div>

      {/* FOOTER MAIN CONTENT ΓÇö 4 columns with generous vertical spacing */}
      <div className="max-w-[1440px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
        
        {/* COLUMN 1: ABOUT */}
        <div className="flex flex-col gap-5">
          {isVerdant ? (
            <Link to="/" className="flex items-center gap-1.5 group">
              <span className="font-sans font-black text-xl text-white tracking-tight transition-colors group-hover:text-moss">
                Verdant<span className="text-moss font-bold">.</span>
              </span>
            </Link>
          ) : (
            <Link to="/" className="flex items-center flex-shrink-0 group outline-none">
              <img 
                src="/Assets/Logo/logo.png" 
                alt="Jhapcham Logo" 
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105" 
              />
            </Link>
          )}
          <p className="leading-relaxed text-gray-400">
            {isVerdant 
              ? 'A curated botanical and outdoor marketplace pairing resilient greenhouse flora with premium utility essentials for the modern botanist.'
              : "Nepal's trusted marketplace for electronics, fashion, and lifestyle products. Every listing is verified ΓÇö shop with confidence, delivered to your door."
            }
          </p>
          <Link to="/about" className={`font-bold transition-colors inline-block mt-1 text-left ${accentColor}`}>
            Read More...
          </Link>
          <div className="flex items-center gap-2.5 mt-1">
            {[
              { label: 'Facebook',  href: 'https://facebook.com',  Icon: Facebook  },
              { label: 'Twitter',   href: 'https://twitter.com',   Icon: Twitter   },
              { label: 'Instagram', href: 'https://instagram.com', Icon: Instagram },
              { label: 'LinkedIn',  href: 'https://linkedin.com',  Icon: Linkedin  },
            ].map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`w-9 h-9 rounded-full border border-gray-700 flex items-center justify-center transition-all ${
                  isVerdant 
                    ? 'hover:border-moss hover:text-moss' 
                    : 'hover:border-green-400 hover:text-green-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* COLUMN 2: CONTACT INFO */}
        <div className="flex flex-col gap-5">
          <h4 className="text-white font-extrabold uppercase tracking-wider text-sm pb-2 border-b border-gray-800">
            Contact Info
          </h4>
          <ul className="flex flex-col gap-4">
            <li className="flex items-start gap-3">
              <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${accentColor}`} />
              <span>{isVerdant ? 'Greenhouse No. 04, Kathmandu, Nepal' : 'Putalisadak, Kathmandu 44600, Nepal'}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className={`w-4 h-4 flex-shrink-0 ${accentColor}`} />
              <span>+977 1 5678890 / +977 9876543210</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className={`w-4 h-4 flex-shrink-0 ${accentColor}`} />
              <a href="mailto:info@jhapcham.com" className={`transition-colors ${hoverColor}`}>
                {isVerdant ? 'hello@verdant.com' : 'info@jhapcham.com'}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${accentColor}`} />
              <div>
                <p className="font-semibold text-gray-300">Working Hours:</p>
                <p>Mon ΓÇô Sun / 9:00 AM ΓÇô 8:00 PM</p>
              </div>
            </li>
          </ul>
        </div>

        {/* COLUMN 3: CUSTOMER SERVICE */}
        <div className="flex flex-col gap-5">
          <h4 className="text-white font-extrabold uppercase tracking-wider text-sm pb-2 border-b border-gray-800">
            Customer Service
          </h4>
          <ul className="grid grid-cols-2 gap-y-3 gap-x-4 text-[11px]">
            {[
              { label: 'Help & FAQs', path: '/help' },
              { label: 'Order Tracking', path: '/customer/orders' },
              { label: 'Shipping & Delivery', path: '/shipping' },
              { label: 'Order History', path: '/customer/orders' },
              { label: 'Seller Dashboard', path: '/seller/dashboard' },
              { label: 'My Account', path: '/customer/dashboard' },
              { label: 'Careers', path: '/careers' },
              { label: 'About Us', path: '/about' },
              { label: 'Become a Merchant', path: '/register' },
              { label: 'Privacy Policy', path: '/privacy' },
            ].map(({ label, path }) => (
              <li key={label}>
                <Link to={path} className={`transition-colors leading-relaxed ${hoverColor}`}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* COLUMN 4: POPULAR TAGS ΓÇö electronics/lifestyle relevant */}
        <div className="flex flex-col gap-5">
          <h4 className="text-white font-extrabold uppercase tracking-wider text-sm pb-2 border-b border-gray-800">
            Popular Tags
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              'Smartphones', 'Headphones', 'Laptops', 'Cameras',
              'Sneakers', 'Watches', 'Jackets', 'Backpacks',
              'Gaming', 'Skincare', 'Home Decor', 'Fitness',
            ].map((tag) => (
              <Link
                key={tag}
                to={`/product-list?q=${encodeURIComponent(tag)}`}
                className={`bg-neutral-800 text-gray-300 px-3 py-1.5 rounded-pill text-[10px] font-bold leading-none transition-all ${
                  isVerdant ? 'hover:bg-moss hover:text-white' : 'hover:bg-green-600 hover:text-white'
                }`}
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* FOOTER BOTTOM BAR */}
      <div className="border-t border-gray-800 py-7 px-6 bg-neutral-950">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-[11px]">
            ┬⌐ {new Date().getFullYear()} {isVerdant ? 'Verdant Marketplace' : 'Jhapcham eCommerce'}. All Rights Reserved.
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="bg-white px-2.5 py-1 rounded shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer">
              <img src="/Assets/Payment%20logo/esewa.png?v=2" alt="eSewa" className="h-5 w-auto object-contain" />
            </div>
            <div className="bg-white px-2.5 py-1 rounded shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer">
              <img src="/Assets/Payment%20logo/khalti.png?v=2" alt="Khalti" className="h-5 w-auto object-contain" />
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}
