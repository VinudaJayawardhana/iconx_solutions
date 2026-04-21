import React, { useState } from "react";
import { db, storage } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import "./ProductAdmin.css";
import "./AddProduct.css";

const AddProduct = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        status: "ACTIVE",
        brands: "",
        price: "",
        stock_in: "",
        description: "",
        category: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = "";
            if (imageFile) {
                const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
                await uploadBytes(imageRef, imageFile);
                imageUrl = await getDownloadURL(imageRef);
            }

            await addDoc(collection(db, "products"), {
                ...formData,
                image: imageUrl,
                price: parseFloat(formData.price),
                stock_in: parseInt(formData.stock_in),
                createdAt: serverTimestamp()
            });

            alert("Product added successfully!");
            navigate("/admin/products");
        } catch (error) {
            console.error("Error adding product: ", error);
            alert("Error adding product. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <span className="logo-icon">icon</span>
                    <span className="logo-text">X</span>
                </div>
                <nav className="admin-nav">
                    <ul>
                        <li onClick={() => navigate("/admin/dashboard")}>Dashboard</li>
                        <li className="active" onClick={() => navigate("/admin/products")}>Product Details</li>
                        <li>Customer Details</li>
                        <li>Select Customer</li>
                        <li>Invoice</li>
                        <li>Registration</li>
                        <li>Attendance</li>
                        <li>Comments</li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-with-back">
                        <button className="btn-back" onClick={() => navigate("/admin/products")}>←</button>
                        <h1>ADD NEW PRODUCT</h1>
                    </div>
                </header>

                <div className="admin-content">
                    <form className="add-product-form" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Product Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. iPhone 15 Pro Max" />
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" value={formData.status} onChange={handleChange}>
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Brand</label>
                                <input type="text" name="brands" value={formData.brands} onChange={handleChange} required placeholder="e.g. Apple" />
                            </div>

                            <div className="form-group">
                                <label>Category</label>
                                <input type="text" name="category" value={formData.category} onChange={handleChange} required placeholder="e.g. Phones" />
                            </div>

                            <div className="form-group">
                                <label>Price (LKR)</label>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} required placeholder="0.00" />
                            </div>

                            <div className="form-group">
                                <label>Stock In</label>
                                <input type="number" name="stock_in" value={formData.stock_in} onChange={handleChange} required placeholder="0" />
                            </div>

                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Enter product description..."></textarea>
                            </div>

                            <div className="form-group full-width">
                                <label>Product Image</label>
                                <div className="image-upload-wrapper">
                                    <input type="file" onChange={handleImageChange} accept="image/*" />
                                    {imageFile && <span className="file-name">{imageFile.name}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => navigate("/admin/products")}>CANCEL</button>
                            <button type="submit" className="btn-save" disabled={loading}>
                                {loading ? "SAVING..." : "ADD PRODUCT"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AddProduct;
