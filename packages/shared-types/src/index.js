"use strict";
// RCMS Shared Types Domain Model
Object.defineProperty(exports, "__esModule", { value: true });
exports.KitchenStation = exports.KDSItemStatus = exports.OrderStatus = exports.OrderType = void 0;
var OrderType;
(function (OrderType) {
    OrderType["DINE_IN"] = "DINE_IN";
    OrderType["TAKEAWAY"] = "TAKEAWAY";
    OrderType["DELIVERY"] = "DELIVERY";
})(OrderType || (exports.OrderType = OrderType = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["DRAFT"] = "DRAFT";
    OrderStatus["PLACED"] = "PLACED";
    OrderStatus["IN_KITCHEN"] = "IN_KITCHEN";
    OrderStatus["READY"] = "READY";
    OrderStatus["SERVED"] = "SERVED";
    OrderStatus["COMPLETED"] = "COMPLETED";
    OrderStatus["CANCELLED"] = "CANCELLED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var KDSItemStatus;
(function (KDSItemStatus) {
    KDSItemStatus["PENDING"] = "PENDING";
    KDSItemStatus["COOKING"] = "COOKING";
    KDSItemStatus["READY"] = "READY";
    KDSItemStatus["BUMPED"] = "BUMPED";
})(KDSItemStatus || (exports.KDSItemStatus = KDSItemStatus = {}));
var KitchenStation;
(function (KitchenStation) {
    KitchenStation["GRILL"] = "GRILL";
    KitchenStation["FRY"] = "FRY";
    KitchenStation["COLD"] = "COLD";
    KitchenStation["BAR"] = "BAR";
})(KitchenStation || (exports.KitchenStation = KitchenStation = {}));
//# sourceMappingURL=index.js.map