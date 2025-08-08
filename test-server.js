const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4001;

app.use(express.json());

// Load products
const productsPath = path.join(__dirname, 'api/data/products.json');
const productsData = fs.readFileSync(productsPath, 'utf8');
const products = JSON.parse(productsData);

// Test endpoint
app.get('/', (req, res) => {
    res.send('Test Server is Running! 🚀');
});

// Local products endpoint
app.get('/api/v1/local-products', (req, res) => {
    res.json({
        success: true,
        products: products
    });
});

// AI search endpoint
app.post('/api/v1/ai-search', (req, res) => {
    const { query } = req.body;
    
    if (!query) {
        return res.status(400).json({
            success: false,
            message: "Search query is required"
        });
    }

    // Simple search implementation
    const lowerQuery = query.toLowerCase();
    const results = [];
    
    // Extract price range from query
    const priceMatch = lowerQuery.match(/(?:under|less than|below|max|maximum)\s*\$?(\d+)/);
    const maxPrice = priceMatch ? parseFloat(priceMatch[1]) : null;
    
    // Extract rating requirements
    const ratingMatch = lowerQuery.match(/(?:good|high|excellent)\s*(?:reviews?|rating)/);
    const minRating = ratingMatch ? 4.0 : null;
    
    // Extract category/keywords
    const keywords = lowerQuery.split(' ').filter(word => 
        word.length > 2 && 
        !['show', 'me', 'with', 'and', 'the', 'for', 'under', 'over', 'good', 'bad', 'high', 'low'].includes(word)
    );

    products.forEach(product => {
        let score = 0;
        let matches = [];
        let shouldInclude = true;
        
        // Check title and description
        const productText = `${product.title} ${product.description} ${product.category}`.toLowerCase();
        
        // Extract specific product types from query
        const productTypes = ['shoes', 'laptops', 'electronics', 'accessories', 'clothing', 'headphones', 'gaming', 'fitness', 'kitchen'];
        const requestedTypes = productTypes.filter(type => lowerQuery.includes(type));
        
        // Check if this product matches the requested type
        let typeMatch = false;
        if (requestedTypes.length > 0) {
            typeMatch = requestedTypes.some(type => 
                productText.includes(type) || product.category.includes(type)
            );
        }
        
        // If specific product type is requested but this product doesn't match, exclude it
        if (requestedTypes.length > 0 && !typeMatch) {
            shouldInclude = false;
        }
        
        // Keyword matching (only if no specific product type is requested or if type matches)
        if (shouldInclude) {
            keywords.forEach(keyword => {
                if (productText.includes(keyword)) {
                    score += 2;
                    matches.push(keyword);
                }
            });
        }
        
        // Price filtering
        if (maxPrice) {
            if (product.price <= maxPrice) {
                score += 3;
                matches.push(`under $${maxPrice}`);
            } else {
                shouldInclude = false; // Exclude if over price limit
            }
        }
        
        // Rating filtering
        if (minRating) {
            if (product.rating >= minRating) {
                score += 2;
                matches.push(`good reviews (${product.rating}⭐)`);
            } else {
                shouldInclude = false; // Exclude if below rating threshold
            }
        }
        
        // Category matching
        if (lowerQuery.includes(product.category)) {
            score += 5;
            matches.push(product.category);
        }
        
        // Only include if all criteria are met and score is positive
        if (shouldInclude && score > 0) {
            results.push({
                ...product,
                searchScore: score,
                matchedTerms: matches
            });
        }
    });
    
    // Sort by relevance score
    results.sort((a, b) => b.searchScore - a.searchScore);
    
    res.json({
        success: true,
        query,
        results: results.slice(0, 8),
        totalResults: results.length
    });
});

app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    console.log(`Test the API at: http://localhost:${PORT}/api/v1/local-products`);
});
