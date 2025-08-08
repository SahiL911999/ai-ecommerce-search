// Test script for AI Search functionality
const fs = require('fs');
const path = require('path');

// Load products
const productsPath = path.join(__dirname, 'api/data/products.json');
const productsData = fs.readFileSync(productsPath, 'utf8');
const products = JSON.parse(productsData);

// AI Search function (same as in controller)
function performSmartSearch(query, products) {
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
        
        // Check title and description
        const productText = `${product.title} ${product.description} ${product.category}`.toLowerCase();
        
        // Keyword matching
        keywords.forEach(keyword => {
            if (productText.includes(keyword)) {
                score += 2;
                matches.push(keyword);
            }
        });
        
        // Price filtering
        if (maxPrice && product.price <= maxPrice) {
            score += 3;
            matches.push(`under $${maxPrice}`);
        } else if (maxPrice && product.price > maxPrice) {
            score = 0; // Exclude if over price limit
        }
        
        // Rating filtering
        if (minRating && product.rating >= minRating) {
            score += 2;
            matches.push(`good reviews (${product.rating}⭐)`);
        } else if (minRating && product.rating < minRating) {
            score = 0; // Exclude if below rating threshold
        }
        
        // Category matching
        if (lowerQuery.includes(product.category)) {
            score += 5;
            matches.push(product.category);
        }
        
        if (score > 0) {
            results.push({
                ...product,
                searchScore: score,
                matchedTerms: matches
            });
        }
    });
    
    // Sort by relevance score
    results.sort((a, b) => b.searchScore - a.searchScore);
    
    return results.slice(0, 8); // Return top 8 results
}

// Test queries
const testQueries = [
    "Show me running shoes under $100 with good reviews",
    "Find electronics under $500",
    "Products with good ratings",
    "laptops under $1500",
    "accessories under $50",
    "training shoes",
    "Find items with high reviews under $200"
];

console.log("🤖 AI Search Test Results\n");
console.log("=" .repeat(50));

testQueries.forEach((query, index) => {
    console.log(`\n${index + 1}. Query: "${query}"`);
    console.log("-".repeat(40));
    
    const results = performSmartSearch(query, products);
    
    if (results.length === 0) {
        console.log("❌ No results found");
    } else {
        console.log(`✅ Found ${results.length} results:`);
        results.forEach((product, idx) => {
            console.log(`   ${idx + 1}. ${product.title} - $${product.price} (Score: ${product.searchScore})`);
            console.log(`      Matched: ${product.matchedTerms.join(", ")}`);
        });
    }
});

console.log("\n" + "=".repeat(50));
console.log("✅ AI Search test completed!");
