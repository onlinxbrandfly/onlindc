export function normalizeId(value){
  if(!value || value === "null" || value === "undefined") return null;
  return value;
}
