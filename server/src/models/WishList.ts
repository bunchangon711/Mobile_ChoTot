import { Schema, model, Document } from "mongoose";
import { ProductDocument } from "./product";
import { UserDocument } from "./user";

export interface WishListDocument extends Document {
  user: UserDocument;
  product: ProductDocument;
}

const wishListSchema = new Schema<WishListDocument>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
}, { timestamps: true });

const WishListModel = model<WishListDocument>("WishList", wishListSchema);

export default WishListModel;
