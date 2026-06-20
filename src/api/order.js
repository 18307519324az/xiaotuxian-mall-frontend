// 订单相关的API函数

import request from "@/utils/request";

/**
 * 结算页面-生成订单-根据购物车选中商品
 * @returns
 */
export const createOrder = () => {
  return request("/member/order/pre", "get");
};

/**
 * 结算页面-生成订单-根据订单中商品-再次购买
 * @returns
 */
export const repurchaseOrder = (orderId) => {
  return request("/member/order/repurchase/" + orderId, "get");
};

/**
 * 添加收货地址
 * @param {Object} form - 参考接口文档
 */
export const addAddress = (form) => {
  return request("/member/address", "post", form);
};

/**
 * 修改收货地址
 * @param {Object} form - 参考接口文档
 */
export const editAddress = (form) => {
  return request(`/member/address/${form.id}`, "put", form);
};

/**
 * 结算页面-提交订单
 * @param {Object} params - 参考接口文档
 * @returns
 */
export const submitOrder = (params) => {
  return request("/member/order", "post", params);
};

/**
 * 获取订单详细
 * @param {String} orderId - 订单ID
 * @returns
 */
export const findOrderDetail = (orderId) => {
  return request("/member/order/" + orderId, "get");
};

export const findOrderDetailByOrderNo = (orderNo) => {
  return request("/member/order/no/" + orderNo, "get");
};
/**
 * 获取订单列表
 * @param {String} page - 页码
 * @param {String} pageSize - 每页条数
 * @param {String} orderState - 订单状态，1为待付款、2为待发货、3为待收货、4为待评价、5为已完成、6为已取消，未传该参数或0为全部
 * @returns
 */
export const findOrderList = ({ page = 1, pageSize = 10, orderState = 0 }) => {
  return request("/member/order", "get", { page, pageSize, orderState });
};

/**
 * 取消订单
 * @param {String} orderId - 订单ID
 * @param {String} cancelReason - 取消原因
 * @returns
 */
export const cancelOrder = ({ orderId, orderNo, cancelReason }) => {
  const identifier = orderNo || orderId;
  return request(`/member/order/${identifier}/cancel`, "put", { cancelReason });
};

/**
 * 删除订单
 * @param {String} orderId - 订单ID
 * @returns
 */
export const deleteOrder = (orderId) => {
  return request("/member/order", "delete", { ids: [orderId] });
};

/**
 * 确认收货
 * @param {String} orderId - 订单ID
 * @returns
 */
export const confirmOrder = (orderId) => {
  return request(`/member/order/${orderId}/receipt`, "put");
};

/**
 * 查询物流
 * @param {String} orderId - 订单ID
 * @returns
 */
export const logisticsOrder = (orderId) => {
  return request(`/member/order/${orderId}/logistics`, "get");
};

/**
 * 删除收货地址
 * @param {String} id - 地址ID
 * @returns
 */
export const deleteAddress = (id) => {
  return request("/member/address/" + id, "delete");
};

/**
 * 支付订单
 * @param {Object} params - { orderId, payChannel }
 * @returns
 */
export const payOrder = (params) => {
  if (params.orderNo) {
    return request(`/member/order/${params.orderNo}/pay`, "post", { payChannel: params.payChannel });
  }
  return request("/member/pay", "post", params);
};

/**
 * 模拟发货（开发/测试用）
 * @param {String} orderId - 订单ID
 * @returns
 */
export const shipOrder = (orderId) => {
  return request(`/member/order/${orderId}/ship`, "put");
};

/**
 * 异步提交订单。
 * 同步完成前置校验 + Redis 预扣，订单由 MQ 异步创建。
 * @param {Object} data - { token, addressId, goods, payChannel, buyerMessage, deliveryTimeType }
 * @returns {Promise<{code:number, data:{orderNo:string, status:string}}>}
 */
export const submitOrderAsyncAPI = (data) => {
  return request("/member/order/async", "post", data);
};

/**
 * 查询异步订单处理状态。
 * @param {String} orderNo - 订单号
 * @returns {Promise<{code:number, data:{orderNo:string, status:string, message:string, orderId:number|null}}>}
 */
export const getOrderProcessAPI = (orderNo) => {
  return request(`/member/order/process/${orderNo}`, "get");
};

/**
 * 获取下单防重复 token。
 * @returns {Promise<{code:number, data:{token:string}}>}
 */
export const getOrderTokenAPI = () => {
  return request("/member/order/token", "get");
};
