const API_BASE = 'http://localhost:8080/api';

/**
 * Fetches all banners from backend
 * @returns {Promise<Array>} Array of banner objects
 */
export const fetchAllBanners = async () => {
  try {
    const response = await fetch(`${API_BASE}/banners/get-all-banners`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const data = await handleResponse(response);
    console.log("banner data", data)
    
    // Transform backend data to match frontend structure
    return data.map(banner => ({
      id: banner.id,
      pageName: banner.pageName,
      header: banner.header,
      text: banner.text,
      // NEW: Handle bannerFileOne as array of carousel images
      carouselImages: banner.bannerFileOne ? banner.bannerFileOne.map(img => 
        `data:image/jpeg;base64,${img}`
      ) : [],
      // Keep other single banner images as before
      images: [
        banner.bannerFileTwo ? `data:image/jpeg;base64,${banner.bannerFileTwo}` : null,
        banner.bannerFileThree ? `data:image/jpeg;base64,${banner.bannerFileThree}` : null,
        banner.bannerFileFour ? `data:image/jpeg;base64,${banner.bannerFileFour}` : null
      ].filter(img => img !== null) // Remove null images
    }));
    
  } catch (error) {
    console.error('Error fetching banners:', error);
    throw error;
  }
};

/**
 * Fetches banners by page name
 * @param {string} pageName - Page name to filter by (e.g., 'home', 'products')
 * @returns {Promise<Object|null>} Banner object or null if not found
 */
export const fetchBannerByPageName = async (pageName) => {
  try {
    const allBanners = await fetchAllBanners();
    const filtered = allBanners.filter(banner => 
      banner.pageName && banner.pageName.toLowerCase() === pageName.toLowerCase()
    );
    
    return filtered.length > 0 ? filtered[0] : null;
    
  } catch (error) {
    console.error(`Error fetching banner for page ${pageName}:`, error);
    throw error;
  }
};

/**
 * NEW: Gets carousel images for a specific page (from bannerFileOne)
 * @param {string} pageName 
 * @returns {Promise<Array>} Array of carousel image URLs
 */
export const getCarouselImagesForPage = async (pageName) => {
  const banner = await fetchBannerByPageName(pageName);
  return banner ? banner.carouselImages : [];
};

/**
 * Gets banner images for a specific page (bannerFileTwo, Three, Four)
 * @param {string} pageName 
 * @returns {Promise<Array>} Array of image URLs
 */
export const getBannerImagesForPage = async (pageName) => {
  const banner = await fetchBannerByPageName(pageName);
  return banner ? banner.images : [];
};

/**
 * Gets banner text content for a specific page
 * @param {string} pageName 
 * @returns {Promise<Object>} {header, text} or null
 */
export const getBannerContentForPage = async (pageName) => {
  const banner = await fetchBannerByPageName(pageName);
  return banner ? { header: banner.header, text: banner.text } : null;
};

/**
 * Handles API response
 * @param {Response} response 
 * @returns {Promise<any>}
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Request failed');
  }
  return response.json();
};