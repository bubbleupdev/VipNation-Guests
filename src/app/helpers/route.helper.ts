
export function isExternalUrl(url) {
  let currentUrl = null;

  if (isValidUrl(url)) {
    currentUrl = new URL(url);
  }
  if (currentUrl && currentUrl.hostname !== window.location.hostname) {
    return true;
  }
  return false;
}

function isValidUrl(url) {
  try {
    const urlObject = new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

