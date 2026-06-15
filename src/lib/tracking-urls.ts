export const getNetworkTrackingUrl = (carrier: string, trackingId: string): string => {
  if (!carrier || !trackingId) return "#";
  
  const cleanId = trackingId.trim();
  
  switch (carrier.toLowerCase()) {
    case 'dhl':
      return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${cleanId}`;
    case 'fedex':
      return `https://www.fedex.com/fedextrack/?trknbr=${cleanId}`;
    default:
      return "#";
  }
};