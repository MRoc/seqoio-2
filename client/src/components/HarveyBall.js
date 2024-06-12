import React from "react";
import PropTypes from "prop-types";
import "./HarveyBall.scss";

export default function HarveyBall(props) {
  function getXY(percent) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  function calculateSvgPathData(percent) {
    // https://medium.com/hackernoon/a-simple-pie-chart-in-svg-dbdd653b6936
    const [startX, startY] = getXY(0);
    const [endX, endY] = getXY(percent);
    const largeArcFlag = percent > 0.5 ? 1 : 0;
    return `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;
  }

  return (
    <svg
      className="HarveyBall"
      viewBox="-1.1 -1.1 2.2 2.2"
      transform="rotate(-90)"
    >
      <path
        className="HarveyBallPie"
        d={calculateSvgPathData(props.progress)}
      />
      <circle
        className="HarveyBallOutline"
        r="1"
        cx="0"
        cy="0"
        strokeWidth="0.2"
      />
    </svg>
  );
}

HarveyBall.propTypes = {
  progress: PropTypes.number.isRequired,
};
