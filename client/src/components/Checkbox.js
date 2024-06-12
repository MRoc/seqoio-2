import React from "react";
import PropTypes from "prop-types";
import "./Checkbox.scss";

export default function Checkbox(props) {
  return (
    <input type="checkbox" checked={props.checked} onChange={props.onChange} />
  );
}

Checkbox.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};
