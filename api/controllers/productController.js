const Product = require('../models/productModel');
const asyncErrorHandler = require('../middlewares/helpers/asyncErrorHandler');
const SearchFeatures = require('../utils/searchFeatures');
const ErrorHandler = require('../utils/errorHandler');
const cloudinary = require('cloudinary');
const fs = require('fs');
const path = require('path');

// Get Local Products from JSON file
exports.getLocalProducts = asyncErrorHandler(async (req, res, next) => {
    try {
        const productsPath = path.join(__dirname, '../data/products.json');
        const productsData = fs.readFileSync(productsPath, 'utf8');
        const products = JSON.parse(productsData);

        res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        return next(new ErrorHandler("Error loading products", 500));
    }
});

// AI-Powered Product Search using OpenAI
exports.aiProductSearch = asyncErrorHandler(async (req, res, next) => {
    const { query } = req.body;
    
    if (!query) {
        return next(new ErrorHandler("Search query is required", 400));
    }

    try {
        // Load products from JSON file
        const productsPath = path.join(__dirname, '../data/products.json');
        const productsData = fs.readFileSync(productsPath, 'utf8');
        const allProducts = JSON.parse(productsData);

        // For demo purposes, we'll implement a simple NLP-like search
        // In a real implementation, you would use OpenAI API here
        const searchResults = performSmartSearch(query, allProducts);

        res.status(200).json({
            success: true,
            query,
            results: searchResults,
            totalResults: searchResults.length
        });
    } catch (error) {
        return next(new ErrorHandler("Error performing AI search", 500));
    }
});

// Smart search function (simulates NLP processing)
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
    
    return results.slice(0, 8); // Return top 8 results
}

// Get All Products
exports.getAllProducts = asyncErrorHandler(async (req, res, next) => {

    const resultPerPage = 12;
    const productsCount = await Product.countDocuments();
    // console.log(req.query);

    const searchFeature = new SearchFeatures(Product.find(), req.query)
        .search()
        .filter();

    let products = await searchFeature.query;
    let filteredProductsCount = products.length;

    searchFeature.pagination(resultPerPage);

    products = await searchFeature.query.clone();

    res.status(200).json({
        success: true,
        products,
        productsCount,
        resultPerPage,
        filteredProductsCount,
    });
});

// Get All Products ---Product Sliders
exports.getProducts = asyncErrorHandler(async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        products,
    });
});

// Get Product Details
exports.getProductDetails = asyncErrorHandler(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    res.status(200).json({
        success: true,
        product,
    });
});

// Get All Products ---ADMIN
exports.getAdminProducts = asyncErrorHandler(async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        products,
    });
});

// Create Product ---ADMIN
exports.createProduct = asyncErrorHandler(async (req, res, next) => {

    let images = [];
    if (typeof req.body.images === "string") {
        images.push(req.body.images);
    } else {
        images = req.body.images;
    }

    const imagesLink = [];

    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "products",
        });

        imagesLink.push({
            public_id: result.public_id,
            url: result.secure_url,
        });
    }

    const result = await cloudinary.v2.uploader.upload(req.body.logo, {
        folder: "brands",
    });
    const brandLogo = {
        public_id: result.public_id,
        url: result.secure_url,
    };

    req.body.brand = {
        name: req.body.brandname,
        logo: brandLogo
    }
    req.body.images = imagesLink;
    req.body.user = req.user.id;

    let specs = [];
    req.body.specifications.forEach((s) => {
        specs.push(JSON.parse(s))
    });
    req.body.specifications = specs;

    const product = await Product.create(req.body);

    res.status(201).json({
        success: true,
        product
    });
});

// Update Product ---ADMIN
exports.updateProduct = asyncErrorHandler(async (req, res, next) => {

    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    if (req.body.images !== undefined) {
        let images = [];
        if (typeof req.body.images === "string") {
            images.push(req.body.images);
        } else {
            images = req.body.images;
        }
        for (let i = 0; i < product.images.length; i++) {
            await cloudinary.v2.uploader.destroy(product.images[i].public_id);
        }

        const imagesLink = [];

        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: "products",
            });

            imagesLink.push({
                public_id: result.public_id,
                url: result.secure_url,
            });
        }
        req.body.images = imagesLink;
    }

    if (req.body.logo.length > 0) {
        await cloudinary.v2.uploader.destroy(product.brand.logo.public_id);
        const result = await cloudinary.v2.uploader.upload(req.body.logo, {
            folder: "brands",
        });
        const brandLogo = {
            public_id: result.public_id,
            url: result.secure_url,
        };

        req.body.brand = {
            name: req.body.brandname,
            logo: brandLogo
        }
    }

    let specs = [];
    req.body.specifications.forEach((s) => {
        specs.push(JSON.parse(s))
    });
    req.body.specifications = specs;
    req.body.user = req.user.id;

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(201).json({
        success: true,
        product
    });
});

// Delete Product ---ADMIN
exports.deleteProduct = asyncErrorHandler(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }

    await product.remove();

    res.status(201).json({
        success: true
    });
});

// Create OR Update Reviews
exports.createProductReview = asyncErrorHandler(async (req, res, next) => {

    const { rating, comment, productId } = req.body;

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
    }

    const product = await Product.findById(productId);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    const isReviewed = product.reviews.find(review => review.user.toString() === req.user._id.toString());

    if (isReviewed) {

        product.reviews.forEach((rev) => { 
            if (rev.user.toString() === req.user._id.toString())
                (rev.rating = rating, rev.comment = comment);
        });
    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }

    let avg = 0;

    product.reviews.forEach((rev) => {
        avg += rev.rating;
    });

    product.ratings = avg / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    });
});

// Get All Reviews of Product
exports.getProductReviews = asyncErrorHandler(async (req, res, next) => {

    const product = await Product.findById(req.query.id);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    res.status(200).json({
        success: true,
        reviews: product.reviews
    });
});

// Delete Reveiws
exports.deleteReview = asyncErrorHandler(async (req, res, next) => {

    const product = await Product.findById(req.query.productId);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    const reviews = product.reviews.filter((rev) => rev._id.toString() !== req.query.id.toString());

    let avg = 0;

    reviews.forEach((rev) => {
        avg += rev.rating;
    });

    let ratings = 0;

    if (reviews.length === 0) {
        ratings = 0;
    } else {
        ratings = avg / reviews.length;
    }

    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings: Number(ratings),
        numOfReviews,
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    });
});