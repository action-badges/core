import core from "@actions/core";
import { makeBadge } from "badge-maker";

function merge(...objects) {
  objects.slice(1).forEach(function (obj) {
    Object.keys(obj).forEach(
      (key) => obj[key] === undefined && delete obj[key],
    );
  });
  return Object.assign(...objects);
}

function getBadgeObjectDefaults() {
  return {
    label: undefined,
    labelColor: "#555",
    message: "message",
    messageColor: "blue",
    style: "flat",
  };
}

function getBadgeObjectYamlInputs() {
  return {
    label: core.getInput("label") || undefined,
    labelColor: core.getInput("label-color") || undefined,
    message: core.getInput("message") || undefined,
    messageColor: core.getInput("message-color") || undefined,
    style: core.getInput("style") || undefined,
  };
}

function getBadgeObject(params) {
  return merge(getBadgeObjectDefaults(), params, getBadgeObjectYamlInputs());
}

function getBadgeSvg({ label, labelColor, message, messageColor, style }) {
  const badge = {};
  if (label != null) {
    badge.label = label;
    badge.labelColor = labelColor;
  }
  badge.message = message;
  badge.color = messageColor;
  badge.style = style;

  return makeBadge(badge);
}

export { getBadgeObject, getBadgeSvg };
