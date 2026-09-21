/** Helpers for MUI Select with numeric/nullable IDs (FlowEditor). */

export const toSelectValue = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
};

export const parseSelectId = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isNaN(n) ? value : n;
};

export const sameSelectId = (a, b) => toSelectValue(a) === toSelectValue(b);

export const selectMenuPropsOverOverlay = (overrides = {}) => ({
  disablePortal: false,
  anchorOrigin: { vertical: "bottom", horizontal: "left" },
  transformOrigin: { vertical: "top", horizontal: "left" },
  getContentAnchorEl: null,
  ...overrides,
});

export const createSelectMenuGuard = (zIndex = 200) => ({
  onMouseDown: (e) => e.stopPropagation(),
  style: { zIndex },
});
