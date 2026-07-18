import React from 'react';

interface ZentexLogoProps {
  className?: string;
  variant?: 'horizontal' | 'badge' | 'icon-only';
}

export default function ZentexLogo({ className = "h-14", variant = "horizontal" }: ZentexLogoProps) {
  const logoUrl = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhpCYW-WSzr856Sn32d1xl9wG6rKwuIBYikzGAu3mnRY4G1LqyBtfv8tzWJT6c309zEESBH1HxxX98Mt9ghlRk6_kK5tDIzrUSQyQ0VHcAM1p7eYayJcIVO3JT9iQs4yHty_X5uuAUfLs1wxKm7BJmj5TfOiETHd73obuNwT5GmJ4RHZf9OYcZmB9dXlZ0/w640-h202/Gemini_Generated_Image_wylulhwylulhwylu.png";

  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center justify-center overflow-hidden ${className}`} id="zentex-logo-icon">
        <img 
          src={logoUrl} 
          alt="Zentex Icon" 
          className="h-full w-auto object-contain max-w-full"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center justify-center p-1 bg-white rounded-xl ${className}`} id="zentex-logo-badge">
        <img 
          src={logoUrl} 
          alt="Zentex Logo Badge" 
          className="h-full w-auto object-contain max-w-full"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`} id="zentex-logo-brand">
      <img 
        src={logoUrl} 
        alt="ZENTEX Limpeza e Conservação" 
        className="h-full w-auto object-contain max-w-full hover:scale-102 transition-transform duration-200"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
