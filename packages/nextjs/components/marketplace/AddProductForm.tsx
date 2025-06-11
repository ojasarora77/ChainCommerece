import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { PlusIcon } from "@heroicons/react/24/outline";

export const AddProductForm = () => {
  const { address } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Electronics",
    price: "",
    imageHash: "",
    metadataHash: ""
  });
  const [isListing, setIsListing] = useState(false);

  const { writeContractAsync: listProduct } = useScaffoldWriteContract({
    contractName: "ProductRegistry",
  });

  const categories = ["Electronics", "Clothing", "Digital", "Sports", "Books", "Home & Garden", "Beauty", "Automotive"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setIsListing(true);
    try {
      await listProduct({
        functionName: "listProduct",
        args: [
          formData.name,
          formData.description,
          formData.category,
          parseEther(formData.price),
          formData.imageHash || `QmHash${Date.now()}`, // Generate a mock hash if empty
          formData.metadataHash || `QmMeta${Date.now()}` // Generate a mock hash if empty
        ],
      });

      // Reset form and close modal
      setFormData({
        name: "",
        description: "",
        category: "Electronics",
        price: "",
        imageHash: "",
        metadataHash: ""
      });
      setIsOpen(false);
      
      // Success notification will be handled by scaffold-eth
      console.log("Product listed successfully!");
    } catch (error) {
      console.error("Error listing product:", error);
    } finally {
      setIsListing(false);
    }
  };

  if (!address) {
    return (
      <div className="alert alert-warning">
        <span>Connect your wallet to list products</span>
      </div>
    );
  }

  return (
    <>
      <button 
        className="btn btn-primary"
        onClick={() => setIsOpen(true)}
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        List New Product
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">List New Product</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Product Name *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description *</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Category *</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Price (ETH) *</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    className="input input-bordered"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Image Hash (Optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="QmHash..."
                    value={formData.imageHash}
                    onChange={(e) => setFormData({ ...formData, imageHash: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Metadata Hash (Optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="QmMeta..."
                    value={formData.metadataHash}
                    onChange={(e) => setFormData({ ...formData, metadataHash: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-action">
                <button 
                  type="button"
                  className="btn"
                  onClick={() => setIsOpen(false)}
                  disabled={isListing}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`btn btn-primary ${isListing ? 'loading' : ''}`}
                  disabled={isListing}
                >
                  {isListing ? 'Listing Product...' : 'List Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
