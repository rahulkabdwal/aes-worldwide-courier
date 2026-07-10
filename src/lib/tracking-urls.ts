export const getNetworkTrackingUrl = (carrier: string, trackingId: string): string => {
  if (!carrier || !trackingId) return "#";

  const cleanId = encodeURIComponent(trackingId.trim());

  switch (carrier.toLowerCase()) {
    case 'self (aes worldwide courier)':
      return `/tracking/${cleanId}`;
    case 'dhl':
      return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${cleanId}`;
    case 'fedex':
      return `https://www.fedex.com/fedextrack/?trknbr=${cleanId}`;
    case 'ups':
      return `https://www.ups.com/track?tracknum=${cleanId}`;
    case 'aramex':
      return `https://www.aramex.com/track/results?mode=0&ShipmentNumber=${cleanId}`;
    case 'shree tirupati courier':
      return `http://www.shreetirupaticourier.net/`;
    case 'dpd uk':
      return `https://www.dpd.co.uk/service/tracking?parcel=${cleanId}`;
    case 'united couriers':
      return `https://unitedcouriers.biz/Track.aspx`;
    case 'blue dart':
      return `https://trackcourier.io/track-and-trace/blue-dart-courier/${cleanId}`;
    case 'dtdc':
      return `https://trackcourier.io/track-and-trace/dtdc/${cleanId}`;
    case 'delhivery':
      return `https://trackcourier.io/track-and-trace/delhivery-courier/${cleanId}`;
    case 'speed post':
    case 'india post':
      return `https://trackcourier.io/track-and-trace/speed-post/${cleanId}`;
    default:
      return "#";
  }
};
