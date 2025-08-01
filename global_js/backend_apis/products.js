const API_BASE = 'https://api.oyjewells.com/api';

/**
 * Fetches all products from backend with pagination
 * @returns {Promise<Array>} Array of product objects
 */
export const fetchAllProducts = async () => {
  try {
    let allProducts = [];
    let page = 0;
    const pageSize = 10; // Number of products per page
    const delayMs = 100; // Delay between page requests in milliseconds
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${API_BASE}/products/get-all-product?page=${page}&size=${pageSize}&delayMillis=${delayMs}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = await handleResponse(response);

      // Transform backend data to match frontend structure
      const transformedData = data.map(product => ({
        id: product.productId,
        name: product.ProductTitle,
        price: product.ProductPrice,
        image: `data:image/jpeg;base64,${product.ProductImage}`,
        description: product.ProductDescription,
        features: product.ProductFeatures,
        sizes: product.ProductSizes,
        stock: product.productQuantity,
        category: product.ProductCategory,
        productDiscount: product.productDiscount,
        productOldPrice: product.ProductOldPrice
      }));

      allProducts = [...allProducts, ...transformedData];

      // Check if there are more pages
      hasMore = data.length === pageSize;
      page++;

      // Add delay between requests
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return allProducts;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Fetches products by category
 * @param {string} category - Category to filter by
 * @returns {Promise<Array>} Array of filtered product objects
 */
export const fetchProductsByCategory = async (category) => {
  try {
    const allProducts = await fetchAllProducts();
    return allProducts.filter(product =>
      product.category && product.category.toLowerCase() === category.toLowerCase()
    );
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
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




// //C:\Jewelry-frontend-updated\global_js\backend_apis\products.js

// const API_BASE = 'https://api.oyjewells.com/api';

// /**
//  * Fetches all products from backend
//  * @returns {Promise<Array>} Array of product objects
//  */
// export const fetchAllProducts = async () => {
//   try {
//     const response = await fetch(`${API_BASE}/products/get-all-product`, {
//       headers: {
//         'Accept': 'application/json'
//       }
//     });
    
//     const data = await handleResponse(response);
    
//     // Transform backend data to match frontend structure
//     return data.map(product => ({
//       id: product.productId,
//       name: product.ProductTitle,
//       price: product.ProductPrice,
//       image: `data:image/jpeg;base64,${product.ProductImage}`,
//       description: product.ProductDescription,
//       features: product.ProductFeatures,
//       sizes: product.ProductSizes,
//       stock: product.productQuantity,
//       category: product.ProductCategory,
//       productDiscount : product.productDiscount,
//       productOldPrice : product.ProductOldPrice
//     }));
    
//   } catch (error) {
//     console.error('Error fetching products:', error);
//     throw error;
//   }
// };

// /**
//  * Fetches products by category
//  * @param {string} category - Category to filter by
//  * @returns {Promise<Array>} Array of filtered product objects
//  */
// export const fetchProductsByCategory = async (category) => {
//   try {
//     const allProducts = await fetchAllProducts();
//     return allProducts.filter(product => 
//       product.category && product.category.toLowerCase() === category.toLowerCase()
//     );
//   } catch (error) {
//     console.error('Error fetching products by category:', error);
//     throw error;
//   }
// };

// /**
//  * Handles API response
//  * @param {Response} response 
//  * @returns {Promise<any>}
//  */
// const handleResponse = async (response) => {
//   if (!response.ok) {
//     const error = await response.text();
//     throw new Error(error || 'Request failed');
//   }
//   return response.json();
// };