import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addCart } from "../redux/action";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const Products = () => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const dispatch = useDispatch();

  const addProduct = (product) => {
    dispatch(addCart(product));
  };

  useEffect(() => {
    const getProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/v1/local-products");
        const result = await response.json();
        if (result.success) {
          setData(result.products);
          setFilter(result.products);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      }
      setLoading(false);
    };

    getProducts();
  }, []);

  const performAISearch = async () => {
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      setFilter(data);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch("/api/v1/ai-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      const result = await response.json();
      if (result.success) {
        setSearchResults(result.results);
        setShowSearchResults(true);
        setFilter(result.results);
        toast.success(`Found ${result.totalResults} products matching your search`);
      }
    } catch (error) {
      console.error("Error performing AI search:", error);
      toast.error("Search failed. Please try again.");
    }
    setIsSearching(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performAISearch();
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
    setFilter(data);
  };

  const filterProduct = (cat) => {
    const updatedList = data.filter((item) => item.category === cat);
    setFilter(updatedList);
    setShowSearchResults(false);
  };

  const Loading = () => {
    return (
      <>
        <div className="col-12 py-5 text-center">
          <Skeleton height={40} width={560} />
        </div>
        <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
          <Skeleton height={592} />
        </div>
        <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
          <Skeleton height={592} />
        </div>
        <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
          <Skeleton height={592} />
        </div>
        <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
          <Skeleton height={592} />
        </div>
        <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
          <Skeleton height={592} />
        </div>
        <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
          <Skeleton height={592} />
        </div>
      </>
    );
  };

  const ShowProducts = () => {
    return (
      <>
        {/* AI Search Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">
                  🤖 AI-Powered Smart Search
                </h5>
                <p className="card-text text-muted mb-3">
                  Try natural language queries like: "Show me running shoes under $100 with good reviews"
                </p>
                <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Describe what you're looking for..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSearching}
                  >
                    {isSearching ? "Searching..." : "🔍 Search"}
                  </button>
                  {showSearchResults && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={clearSearch}
                    >
                      Clear
                    </button>
                  )}
                </form>
                {showSearchResults && searchResults.length > 0 && (
                  <div className="mt-3">
                    <small className="text-success">
                      ✨ AI found {searchResults.length} relevant products
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        {!showSearchResults && (
          <div className="buttons text-center py-3">
            <button
              className="btn btn-outline-dark btn-sm m-2"
              onClick={() => setFilter(data)}
            >
              All
            </button>
            <button
              className="btn btn-outline-dark btn-sm m-2"
              onClick={() => filterProduct("running shoes")}
            >
              Running Shoes
            </button>
            <button
              className="btn btn-outline-dark btn-sm m-2"
              onClick={() => filterProduct("training shoes")}
            >
              Training Shoes
            </button>
            <button
              className="btn btn-outline-dark btn-sm m-2"
              onClick={() => filterProduct("laptops")}
            >
              Laptops
            </button>
            <button
              className="btn btn-outline-dark btn-sm m-2"
              onClick={() => filterProduct("electronics")}
            >
              Electronics
            </button>
            <button
              className="btn btn-outline-dark btn-sm m-2"
              onClick={() => filterProduct("clothing")}
            >
              Clothing
            </button>
            <button
              className="btn btn-outline-dark btn-sm m-2"
              onClick={() => filterProduct("accessories")}
            >
              Accessories
            </button>
          </div>
        )}

        {/* Products Grid */}
        {filter.map((product) => {
          return (
            <div
              id={product.id}
              key={product.id}
              className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4"
            >
              <div className="card text-center h-100" key={product.id}>
                <img
                  className="card-img-top p-3"
                  src={product.imageUrl}
                  alt={product.title}
                  height={300}
                  style={{ objectFit: "contain" }}
                />
                <div className="card-body">
                  <h5 className="card-title">
                    {product.title.length > 30
                      ? product.title.substring(0, 30) + "..."
                      : product.title}
                  </h5>
                  <p className="card-text">
                    {product.description.length > 90
                      ? product.description.substring(0, 90) + "..."
                      : product.description}
                  </p>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-primary">{product.category}</span>
                    <div className="d-flex align-items-center">
                      <span className="text-warning me-1">
                        {"⭐".repeat(Math.floor(product.rating))}
                      </span>
                      <small className="text-muted">
                        {product.rating} ({product.reviews})
                      </small>
                    </div>
                  </div>
                </div>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item lead fw-bold">
                    $ {product.price}
                  </li>
                </ul>
                <div className="card-body">
                  <Link
                    to={"/product/" + product.id}
                    className="btn btn-dark m-1"
                  >
                    Buy Now
                  </Link>
                  <button
                    className="btn btn-dark m-1"
                    onClick={() => {
                      toast.success("Added to cart");
                      addProduct(product);
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
                {showSearchResults && product.matchedTerms && (
                  <div className="card-footer bg-light">
                    <small className="text-muted">
                      Matched: {product.matchedTerms.join(", ")}
                    </small>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <>
      <div className="container my-3 py-3">
        <div className="row">
          <div className="col-12">
            <h2 className="display-5 text-center">
              {showSearchResults ? "AI Search Results" : "Product Catalog"}
            </h2>
            <hr />
          </div>
        </div>
        <div className="row justify-content-center">
          {loading ? <Loading /> : <ShowProducts />}
        </div>
      </div>
    </>
  );
};

export default Products;
