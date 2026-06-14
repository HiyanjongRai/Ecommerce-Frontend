// import React from 'react';
// import { Link } from 'react-router-dom';

// const LandingPageHero = () => {
//   return (
//     <section className="landing-hero-wrapper">
//       <style>{`
//         .landing-hero-wrapper {
//           width: 100%;
//           min-height: 100vh;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           background: linear-gradient(135deg, #0F9D58 0%, #0b7a44 50%, #111111 100%);
//           position: relative;
//           overflow: hidden;
//         }

//         .landing-hero-content {
//           max-width: 1400px;
//           width: 100%;
//           padding: 80px 40px;
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           gap: 60px;
//           align-items: center;
//           position: relative;
//           z-index: 2;
//         }

//         .landing-hero-text {
//           display: flex;
//           flex-direction: column;
//           gap: 30px;
//         }

//         .landing-hero-tag {
//           display: inline-flex;
//           align-items: center;
//           gap: 10px;
//           background: rgba(255, 255, 255, 0.15);
//           color: #fff;
//           font-size: 14px;
//           font-weight: 600;
//           padding: 10px 20px;
//           border-radius: 50px;
//           width: fit-content;
//           backdrop-filter: blur(10px);
//         }

//         .landing-hero-tag::before {
//           content: '✨';
//           font-size: 16px;
//         }

//         .landing-hero-title {
//           font-size: clamp(36px, 6vw, 72px);
//           font-weight: 900;
//           line-height: 1.1;
//           color: #fff;
//           letter-spacing: -2px;
//         }

//         .landing-hero-subtitle {
//           font-size: clamp(16px, 2vw, 22px);
//           color: rgba(255, 255, 255, 0.85);
//           line-height: 1.6;
//           font-weight: 500;
//         }

//         .landing-hero-buttons {
//           display: flex;
//           gap: 16px;
//           flex-wrap: wrap;
//           margin-top: 20px;
//         }

//         .landing-btn-primary {
//           padding: 16px 36px;
//           background: #fff;
//           color: #0F9D58;
//           border: none;
//           border-radius: 12px;
//           font-size: 16px;
//           font-weight: 700;
//           cursor: pointer;
//           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
//           box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
//           text-decoration: none;
//           display: inline-flex;
//           align-items: center;
//           gap: 10px;
//         }

//         .landing-btn-primary:hover {
//           transform: translateY(-4px);
//           box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
//         }

//         .landing-btn-secondary {
//           padding: 16px 36px;
//           background: transparent;
//           color: #fff;
//           border: 2px solid #fff;
//           border-radius: 12px;
//           font-size: 16px;
//           font-weight: 700;
//           cursor: pointer;
//           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
//           text-decoration: none;
//           display: inline-flex;
//           align-items: center;
//           gap: 10px;
//         }

//         .landing-btn-secondary:hover {
//           background: rgba(255, 255, 255, 0.1);
//           transform: translateY(-4px);
//         }

//         .landing-hero-visual {
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           position: relative;
//         }

//         .landing-hero-image {
//           width: 100%;
//           aspect-ratio: 1;
//           background: rgba(255, 255, 255, 0.08);
//           border-radius: 24px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 120px;
//           backdrop-filter: blur(10px);
//           border: 1px solid rgba(255, 255, 255, 0.2);
//           animation: float 6s ease-in-out infinite;
//           box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
//         }

//         @keyframes float {
//           0%, 100% {
//             transform: translateY(0px);
//           }
//           50% {
//             transform: translateY(-20px);
//           }
//         }

//         .landing-hero-stats {
//           display: grid;
//           grid-template-columns: repeat(3, 1fr);
//           gap: 30px;
//           margin-top: 50px;
//         }

//         .landing-stat {
//           text-align: center;
//         }

//         .landing-stat-number {
//           font-size: clamp(24px, 4vw, 40px);
//           font-weight: 900;
//           color: #fff;
//           line-height: 1;
//         }

//         .landing-stat-label {
//           font-size: 14px;
//           color: rgba(255, 255, 255, 0.8);
//           margin-top: 8px;
//           font-weight: 600;
//         }

//         .landing-hero-glow {
//           position: absolute;
//           width: 500px;
//           height: 500px;
//           background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
//           border-radius: 50%;
//           top: 50%;
//           right: -200px;
//           transform: translateY(-50%);
//           z-index: 1;
//           pointer-events: none;
//         }

//         .landing-hero-glow-2 {
//           position: absolute;
//           width: 400px;
//           height: 400px;
//           background: radial-gradient(circle, rgba(15, 157, 88, 0.2) 0%, transparent 70%);
//           border-radius: 50%;
//           top: 30%;
//           left: -150px;
//           z-index: 1;
//           pointer-events: none;
//         }

//         @media (max-width: 900px) {
//           .landing-hero-content {
//             grid-template-columns: 1fr;
//             padding: 60px 30px;
//             gap: 40px;
//           }

//           .landing-hero-visual {
//             order: -1;
//           }

//           .landing-hero-image {
//             aspect-ratio: 4/3;
//           }
//         }

//         @media (max-width: 600px) {
//           .landing-hero-wrapper {
//             min-height: auto;
//             padding: 60px 0;
//           }

//           .landing-hero-content {
//             padding: 40px 20px;
//             gap: 30px;
//           }

//           .landing-hero-title {
//             font-size: 32px;
//           }

//           .landing-hero-subtitle {
//             font-size: 16px;
//           }

//           .landing-hero-buttons {
//             flex-direction: column;
//           }

//           .landing-btn-primary,
//           .landing-btn-secondary {
//             width: 100%;
//             justify-content: center;
//           }

//           .landing-hero-stats {
//             grid-template-columns: repeat(2, 1fr);
//             gap: 20px;
//             margin-top: 30px;
//           }
//         }
//       `}</style>

//       <div className="landing-hero-glow-2"></div>
//       <div className="landing-hero-glow"></div>

//       <div className="landing-hero-content">
//         <div className="landing-hero-text">
//           <div className="landing-hero-tag">Welcome to Premium Shopping</div>

//           <div>
//             <h1 className="landing-hero-title">
//               Discover Amazing Products at <span style={{ color: '#fff' }}>Unbeatable Prices</span>
//             </h1>
//             <p className="landing-hero-subtitle">
//               Shop the latest electronics, fashion, home essentials, and more from trusted sellers worldwide. Get exclusive deals and fast delivery.
//             </p>
//           </div>

//           <div className="landing-hero-buttons">
//             <Link to="/products" className="landing-btn-primary">
//               Start Shopping →
//             </Link>
//             <Link to="/deals" className="landing-btn-secondary">
//               View Today's Deals
//             </Link>
//           </div>

//           <div className="landing-hero-stats">
//             <div className="landing-stat">
//               <div className="landing-stat-number">4K+</div>
//               <div className="landing-stat-label">Products</div>
//             </div>
//             <div className="landing-stat">
//               <div className="landing-stat-number">200+</div>
//               <div className="landing-stat-label">Brands</div>
//             </div>
//             <div className="landing-stat">
//               <div className="landing-stat-number">2M+</div>
//               <div className="landing-stat-label">Customers</div>
//             </div>
//           </div>
//         </div>

//         <div className="landing-hero-visual">
//           <div className="landing-hero-image">🛍️</div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default LandingPageHero;
