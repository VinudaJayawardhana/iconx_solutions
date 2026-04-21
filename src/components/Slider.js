import React from "react";
import Slider from "react-slick";
import "./Slider.css";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import iphoneImage from "../images/iphone.png";
import macImage from "../images/macbook1.jpg";
import ipadImage from "../images/ipad1.jpg";

const products = [
  {
    title: "iPhone 17 Pro",
    subtitle: "Experience the future in your hands.",
    tagline: "Innovation redefined.",
    image: iphoneImage
  },
  {
    title: "MacBook Air",
    subtitle: "Light. Powerful. Effortless.",
    tagline: "Work and create without limits.",
    image: macImage
  },
  {
    title: "iPad Pro",
    subtitle: "Unleash your creativity anywhere.",
    tagline: "Your ideas, your canvas.",
    image: ipadImage
  }
];

const ProductSlider = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 1200,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    fade: true,
    pauseOnHover: false
  };

  return (
    <div className="apple-slider">
      <Slider {...settings}>
        {products.map((product, index) => (
          <div className="apple-slide" key={index}>
            <div className="content-wrapper">
              <h1>{product.title}</h1>
              <p className="subtitle">{product.subtitle}</p>
              <p className="tagline">{product.tagline}</p>

              <div className="buttons">
                <button className="primary-btn">Buy</button>
                <button className="secondary-btn">Learn more</button>
              </div>
            </div>

            <div className="image-wrapper">
              <img src={product.image} alt={product.title} />
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ProductSlider;