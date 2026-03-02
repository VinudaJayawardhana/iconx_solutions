import React from "react";
import Slider from "react-slick";
import "../components/Slider.css";

// Import images properly
import macImage from "../images/mac.png";
import ipadImage from "../images/ipad.png";
import iphoneImage from "../images/iphone.png";

const ProductSlider = () => {
  const settings = {
    dots: true,             // navigation dots
    infinite: true,         // loop slides
    speed: 600,             // smoother transition
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,         // auto play enabled
    autoplaySpeed: 4000,    // 4 seconds per slide
    arrows: true,           // show next/prev arrows
    pauseOnHover: true,     // pause autoplay when hovered
    adaptiveHeight: true    // adjust height per slide
  };

  return (
    <div className="slider-container">
      <Slider {...settings}>
        <div className="slide">
          <img src={macImage} alt="iPhone 17 Pro" />
          <h2>iPhone 17 Pro</h2>
          <p>Buy Now</p>
        </div>
        <div className="slide">
          <img src={ipadImage} alt="MacBook Air" />
          <h2>MacBook Air 15"</h2>
          <p>Powered by M4 Chip</p>
        </div>
        <div className="slide">
          <img src={iphoneImage} alt="iPad Pro" />
          <h2>iPad Pro 13"</h2>
          <p>Next-gen performance</p>
        </div>
      </Slider>
    </div>
  );
};

export default ProductSlider;