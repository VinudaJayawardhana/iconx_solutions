import React from "react";
import "../components/FeatureSection.css";

const features = [
  {
    iconColor: "#0071E3",
    title: "Stunning Display",
    description:
      "Experience vibrant colors and true-to-life visuals engineered for perfection.",
    svg: (
      <svg viewBox="0 0 24 24" width="28" height="28">
        <path d="M2 3h20v14H2z" />
      </svg>
    ),
  },
  {
    iconColor: "#FF9F0A",
    title: "Lightning Fast",
    description:
      "Powered by next-generation silicon for seamless performance.",
    svg: (
      <svg viewBox="0 0 24 24" width="28" height="28">
        <path d="M13 2L3 14h9v8l10-12h-9z" />
      </svg>
    ),
  },
  {
    iconColor: "#30D158",
    title: "All-Day Battery",
    description:
      "Designed to keep up with you from morning to night.",
    svg: (
      <svg viewBox="0 0 24 24" width="28" height="28">
        <path d="M16 4H8v16h8V4zm2-2v20H6V2h12z" />
      </svg>
    ),
  },
  {
    iconColor: "#5E5CE6",
    title: "Advanced Security",
    description:
      "Industry-leading protection built directly into the hardware.",
    svg: (
      <svg viewBox="0 0 24 24" width="28" height="28">
        <path d="M12 1C7 1 3 5 3 10v6h18v-6c0-5-4-9-9-9zm0 4a3 3 0 013 3v2h-6v-2a3 3 0 013-3z" />
      </svg>
    ),
  },
];

const FeaturesSection = () => {
  return (
    <section className="features-section">
      <div className="features-wrapper">
        <h2 className="section-heading">Why Choose Our Devices</h2>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div
                className="feature-icon"
                style={{
                  backgroundColor: feature.iconColor + "15",
                  color: feature.iconColor,
                }}
              >
                {feature.svg}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;