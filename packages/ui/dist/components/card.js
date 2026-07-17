"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = Card;
exports.CardHeader = CardHeader;
exports.CardFooter = CardFooter;
exports.CardTitle = CardTitle;
exports.CardAction = CardAction;
exports.CardDescription = CardDescription;
exports.CardContent = CardContent;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("../utils");
function Card({ className, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { "data-slot": "card", className: (0, utils_1.cn)("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className), ...props }));
}
function CardHeader({ className, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { "data-slot": "card-header", className: (0, utils_1.cn)("@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6", className), ...props }));
}
function CardTitle({ className, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { "data-slot": "card-title", className: (0, utils_1.cn)("leading-none font-semibold", className), ...props }));
}
function CardDescription({ className, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { "data-slot": "card-description", className: (0, utils_1.cn)("text-muted-foreground text-sm", className), ...props }));
}
function CardAction({ className, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { "data-slot": "card-action", className: (0, utils_1.cn)("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className), ...props }));
}
function CardContent({ className, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { "data-slot": "card-content", className: (0, utils_1.cn)("px-6", className), ...props }));
}
function CardFooter({ className, ...props }) {
    return ((0, jsx_runtime_1.jsx)("div", { "data-slot": "card-footer", className: (0, utils_1.cn)("flex items-center px-6 [.border-t]:pt-6", className), ...props }));
}
//# sourceMappingURL=card.js.map