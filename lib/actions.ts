export function callPharmacy(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, "");
  if (!cleaned) return false;
  window.location.href = `tel:${cleaned}`;
  return true;
}

export function navigateTo(name: string, lat: number, lng: number) {
  const url = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
