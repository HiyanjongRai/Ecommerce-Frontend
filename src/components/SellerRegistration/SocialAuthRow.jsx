import React from 'react';

const SocialAuthRow = ({ onClick }) => {
  const handleSocialClick = (provider) => {
    if (onClick) onClick(provider);
    else console.log(`Social auth trigger: ${provider}`);
  };

  return (
    <div className="w-full font-inter">
      {/* Divider */}
      <div className="relative flex py-3 items-center">
        <div className="flex-grow border-t border-reg-border"></div>
        <span className="flex-shrink mx-4 text-xs font-bold text-reg-text-sec uppercase tracking-widest">
          or sign up with
        </span>
        <div className="flex-grow border-t border-reg-border"></div>
      </div>

      {/* Buttons Row */}
      <div className="grid grid-cols-3 gap-3 mt-2">
        {/* Google */}
        <button
          type="button"
          onClick={() => handleSocialClick('Google')}
          className="flex items-center justify-center py-2.5 px-4 border border-reg-border hover:border-gray-300 rounded-xl bg-white hover:bg-gray-50/50 shadow-2xs transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus:ring-4 focus:ring-reg-primary/10"
          aria-label="Register with Google"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
        </button>

        {/* Facebook */}
        <button
          type="button"
          onClick={() => handleSocialClick('Facebook')}
          className="flex items-center justify-center py-2.5 px-4 border border-reg-border hover:border-gray-300 rounded-xl bg-white hover:bg-gray-50/50 shadow-2xs transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus:ring-4 focus:ring-reg-primary/10"
          aria-label="Register with Facebook"
        >
          <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </button>

        {/* Apple */}
        <button
          type="button"
          onClick={() => handleSocialClick('Apple')}
          className="flex items-center justify-center py-2.5 px-4 border border-reg-border hover:border-gray-300 rounded-xl bg-white hover:bg-gray-50/50 shadow-2xs transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus:ring-4 focus:ring-reg-primary/10"
          aria-label="Register with Apple"
        >
          <svg className="w-5 h-5 text-reg-accent" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.029-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.51 12.067 1.007 1.452 2.2 3.076 3.774 3.02 1.524-.067 2.09-.982 3.935-.982 1.829 0 2.362.982 3.959.948 1.623-.03 2.645-1.47 3.626-2.906 1.137-1.656 1.6-3.255 1.629-3.34-.057-.024-3.138-1.2-3.176-4.783-.028-2.991 2.448-4.428 2.563-4.495-1.398-2.05-3.559-2.285-4.325-2.336-2.029-.166-3.097.833-4.049.833zm2.96-4.684c.82-.993 1.373-2.38 1.222-3.762-1.188.048-2.628.792-3.48 1.792-.76.877-1.424 2.283-1.246 3.64 1.325.103 2.684-.677 3.504-1.67z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SocialAuthRow;
