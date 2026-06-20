<template>  <div class="xtx-pay-checkout-page">
    <div class="container">
      <XtxBread>
        <XtxBreadItem to="/">首页</XtxBreadItem>
        <XtxBreadItem to="/cart">购物车</XtxBreadItem>
        <XtxBreadItem>填写订单</XtxBreadItem>
      </XtxBread>
      <div class="wrapper" v-if="order">
        <!-- 收货地址 -->
        <h3 class="box-title">收货地址</h3>
        <div class="box-body">
          <!-- 收货地址组件 -->
          <CheckoutAddress @change="changeAddress" :list="order.userAddresses" />
        </div>
        <!-- 商品信息 -->
        <h3 class="box-title">商品信息</h3>
        <div class="box-body">
          <table class="goods">
            <thead>
              <tr>
                <th width="520">商品信息</th>
                <th width="170">单价</th>
                <th width="170">数量</th>
                <th width="170">小计</th>
                <th width="170">实付</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in order.goods" :key="item.skuId">
                <td>
                  <a href="javascript:;" class="info">
                    <img :src="item.picture" alt="" />
                    <div class="right">
                      <p>{{ item.name }}</p>
                      <p>{{ formatAttrsText(item.attrsText) }}</p>
                      <p class="stock-line" :class="stockClass(item)">{{ stockText(item) }}</p>
                    </div>
                  </a>
                </td>
                <td>&yen;{{ item.price }}</td>
                <td>{{ item.count }}</td>
                <td>&yen;{{ item.totalPrice }}</td>
                <td>&yen;{{ item.totalPayPrice }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 配送时间 -->
        <h3 class="box-title">配送时间</h3>
        <div class="box-body">
          <a class="my-btn" :class="{ active: deliveryTimeType === 1 }" href="javascript:;" @click="selectDeliveryTime(1)">不限送货时间：周一至周日</a>
          <a class="my-btn" :class="{ active: deliveryTimeType === 2 }" href="javascript:;" @click="selectDeliveryTime(2)">工作日送货：周一至周五</a>
          <a class="my-btn" :class="{ active: deliveryTimeType === 3 }" href="javascript:;" @click="selectDeliveryTime(3)">双休日、假日送货：周六至周日</a>
        </div>
        <!-- 支付方式 -->
        <h3 class="box-title">支付方式</h3>
        <div class="box-body">
          <a class="my-btn" :class="{ active: payType === 1 }" href="javascript:;" @click="selectPayType(1)">在线支付</a>
          <a class="my-btn" :class="{ active: payType === 2 }" href="javascript:;" @click="selectPayType(2)">货到付款</a>
          <span style="color: #999">货到付款需付5元手续费</span>
        </div>
        <!-- ==================== 优惠券模块 ==================== -->
        <div class="checkout-section benefit-section">
          <h3 class="box-title">优惠券</h3>
          <div class="box-body">
            <div class="benefit-row">
              <div class="benefit-info">
                <template v-if="selectedCoupon">
                  <span class="benefit-name">{{ selectedCoupon.name || selectedCoupon.title || selectedCoupon.id }}</span>
                  <span class="benefit-amount">-¥{{ formatMoney(selectedCoupon.amount || selectedCoupon.discountAmount || selectedCoupon.value || 0) }}</span>
                </template>
                <template v-else>
                  <span class="benefit-empty">未使用优惠券</span>
                </template>
              </div>
              <button class="benefit-btn" type="button" @click="couponPanelVisible = !couponPanelVisible">
                {{ selectedCoupon ? '更换优惠券' : '选择优惠券' }}
              </button>
              <button v-if="selectedCoupon" class="benefit-link" type="button" @click="clearCoupon">不使用</button>
            </div>
            <div class="coupon-panel" v-if="couponPanelVisible">
              <div class="coupon-panel-head">
                <span>选择优惠券</span>
                <button type="button" class="benefit-link" @click="couponPanelVisible = false">关闭</button>
              </div>
              <div v-if="usableCoupons.length > 0" class="coupon-list">
                <div v-for="coupon in usableCoupons" :key="coupon.id"
                  class="coupon-list-item">
                  <div class="coupon-list-info">
                    <div class="coupon-list-title">{{ coupon.name || coupon.title || coupon.id }}</div>
                    <div class="coupon-list-desc">
                      满 ¥{{ formatMoney(coupon.minPrice || coupon.threshold || coupon.minimumAmount || 0) }} 可用，
                      抵扣 ¥{{ formatMoney(coupon.amount || coupon.discountAmount || coupon.value || 0) }}
                    </div>
                  </div>
                  <button class="benefit-btn-sm" type="button" @click="selectCoupon(coupon)">使用</button>
                </div>
              </div>
              <div v-else class="benefit-empty-box">暂无可用优惠券</div>
              <div class="coupon-exchange">
                <input v-model.trim="couponExchangeCode" placeholder="请输入优惠券兑换码" />
                <button class="benefit-btn-sm" type="button" @click="exchangeCoupon" :disabled="!couponExchangeCode">兑换优惠券</button>
              </div>
            </div>
          </div>
        </div>
        <!-- ==================== 礼品卡模块 ==================== -->
        <div class="checkout-section benefit-section">
          <h3 class="box-title">礼品卡</h3>
          <div class="box-body">
            <div class="gift-card-input-row">
              <input v-model.trim="giftCardInput" placeholder="请输入礼品卡码" :disabled="!!selectedGiftCardCode" />
              <button class="benefit-btn" type="button" @click="useGiftCard" :disabled="!giftCardInput || !!selectedGiftCardCode">使用礼品卡</button>
            </div>
            <div v-if="selectedGiftCardCode" class="gift-card-used">
              <span>已使用：{{ selectedGiftCardCode }}</span>
              <span>抵扣：-¥{{ formatMoney(giftCardDeductAmount) }}</span>
              <button class="benefit-link" type="button" @click="clearGiftCard">取消使用</button>
            </div>
            <div v-else-if="giftCards.length > 0" class="gift-card-list-inline">
              <div v-for="card in giftCards" :key="card.code || card.giftCardCode"
                class="gift-card-list-item">
                <span class="gift-card-code-text">{{ card.code || card.giftCardCode }}</span>
                <span class="gift-card-balance-text">余额 ¥{{ formatMoney(card.balance || card.availableAmount || 0) }}</span>
                <button class="benefit-btn-sm" type="button" @click="selectGiftCardFromList(card)">使用</button>
              </div>
            </div>
            <div v-else class="benefit-empty-box">暂无已绑定礼品卡，可输入礼品卡码使用</div>
          </div>
        </div>
        <!-- 金额明细 -->
        <h3 class="box-title">金额明细</h3>
        <div class="box-body">
          <div class="total">
            <dl>
              <dt>商品金额：</dt>
              <dd>¥{{ formatMoney(goodsAmount) }}</dd>
            </dl>
            <dl>
              <dt>{{ payType === 2 ? '运费/手续费：' : '运费：' }}</dt>
              <dd>¥{{ formatMoney(freightAmount) }}</dd>
            </dl>
            <dl>
              <dt>优惠券抵扣：</dt>
              <dd class="discount">-¥{{ formatMoney(couponDiscountAmount) }}</dd>
            </dl>
            <dl>
              <dt>礼品卡抵扣：</dt>
              <dd class="discount">-¥{{ formatMoney(giftCardDeductAmount) }}</dd>
            </dl>
            <dl v-if="selectedGiftCardCode">
              <dt>使用礼品卡：</dt>
              <dd>{{ selectedGiftCardCode }}</dd>
            </dl>
            <dl>
              <dt>应付总额：</dt>
              <dd class="price">¥{{ formatMoney(finalPayMoney) }}</dd>
            </dl>
          </div>
        </div>
        <!-- 提交订单 -->
        <div class="submit">
          <XtxButton @click="submitOrderFn" type="primary" :disabled="submitDisabled || submitting || processing">
            {{ submitting ? '正在提交...' : processing ? '订单处理中...' : '提交订单' }}
          </XtxButton>
          <p v-if="goodsEmpty" class="empty-tip">没有可结算的商品，请先去购物车选择商品</p>
          <p v-else-if="zeroPrice" class="empty-tip">再次购买商品信息异常，请返回订单重新操作</p>
        </div>
      </div>
      <!-- 订单处理中遮罩 -->
      <div v-if="processing" class="processing-overlay">
        <div class="processing-box">
          <div class="processing-spinner"></div>
          <p class="processing-text">{{ processMessage || '订单正在创建中，请稍候...' }}</p>
          <p class="processing-order">订单号：{{ processOrderNo }}</p>
        </div>
      </div>
      <!-- 空商品提示 -->
      <div v-else class="wrapper-empty">
        <p class="empty-msg">订单加载中...</p>
      </div>
    </div>
  </div>
</template>
<script>
import CheckoutAddress from "./components/checkout-address";
import { createOrder, submitOrder, repurchaseOrder, submitOrderAsyncAPI, getOrderProcessAPI, getOrderTokenAPI } from "@/api/order";
import { findMemberCoupons, exchangeMemberCoupon, findGiftCards, bindGiftCard } from "@/api/member";
import { formatAttrsText } from "@/utils/format";
import { reactive, ref, computed, onBeforeUnmount } from "vue";
import Message from "@/components/library/Message";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
export default {
  name: "XtxPayCheckoutPage",
  components: { CheckoutAddress },
  setup() {
    // 结算功能-生成订单-订单信息
    const store = useStore();
    const order = ref(null);
    const route = useRoute();
    const router = useRouter();

    // ========== 优惠券状态 ==========
    const couponPanelVisible = ref(false);
    const couponExchangeCode = ref("");
    const memberCoupons = ref([]);
    const selectedCouponId = ref(null);

    // ========== 礼品卡状态 ==========
    const giftCards = ref([]);
    const giftCardInput = ref("");
    const selectedGiftCardCode = ref(null);

    // ========== 异步订单状态 ==========
    const submitting = ref(false);
    const processing = ref(false);
    const processMessage = ref("");
    const processOrderNo = ref("");
    const orderToken = ref("");
    let pollTimer = null;

    // ========== 格式化 ==========
    const toNumber = (val) => {
      const num = Number(val);
      return Number.isFinite(num) ? num : 0;
    };

    const pickNumber = (...values) => {
      for (const v of values) {
        const num = Number(v);
        if (Number.isFinite(num) && num !== 0) return num;
      }
      return 0;
    };

    const pickOptionalNumber = (...values) => {
      for (const v of values) {
        if (v !== undefined && v !== null && v !== '') {
          const num = Number(v);
          if (Number.isFinite(num)) return num;
        }
      }
      return 0;
    };

    const formatMoney = (val) => {
      return toNumber(val).toFixed(2);
    };

    // ========== 数据加载 ==========
    const loadCoupons = () => {
      findMemberCoupons().then(data => {
        const list = data.result?.items || data.result?.coupons || [];
        memberCoupons.value = Array.isArray(list) ? list : [];
      }).catch(() => {});
    };

    const loadGiftCards = () => {
      findGiftCards().then(data => {
        const result = data.result || {};
        const cards = result.cards || result.list || result || [];
        const list = Array.isArray(cards) ? cards : [];
        giftCards.value = list.filter(c => c.balance > 0 || c.availableAmount > 0);
      }).catch(() => {});
    };

    const loadOrderToken = () => {
      getOrderTokenAPI().then((data) => {
        if (data?.result?.token) {
          orderToken.value = data.result.token;
        }
      }).catch(() => {});
    };

    const afterOrderLoad = (data) => {
      order.value = data.result;
      reqParams.goods = (data.result.goods || []).map(({ skuId, count }) => ({ skuId, count }));
      loadCoupons();
      loadGiftCards();
    };

    if (route.query.orderId) {
      repurchaseOrder(route.query.orderId).then(afterOrderLoad);
    } else {
      createOrder().then(afterOrderLoad);
    }

    loadOrderToken();

    // ========== 优惠券计算 ==========
    const isFreightCouponType = (couponType) => {
      return ['freight', 'shipping', 'freeShipping', '运费券', '包邮券'].includes(couponType);
    };

    const isCouponUsable = (coupon) => {
      if (!coupon) return false;
      const minPrice = parseFloat(coupon.minPrice || coupon.threshold || coupon.minimumAmount || "0");
      if (minPrice <= 0) return true;
      return goodsAmount.value >= minPrice;
    };

    const calculateCouponDiscount = (coupon) => {
      if (!coupon) return 0;
      const amount = parseFloat(coupon.amount || coupon.discountAmount || coupon.value || "0");
      if (amount <= 0) return 0;
      if (isFreightCouponType(coupon.couponType)) {
        return Math.min(amount, freightAmount.value);
      }
      return Math.min(amount, goodsAmount.value);
    };

    const allCoupons = computed(() => {
      const previewCoupons = order.value?.coupons || [];
      if (previewCoupons.length > 0) return previewCoupons;
      return memberCoupons.value;
    });

    const usableCoupons = computed(() => {
      return allCoupons.value.filter(c => isCouponUsable(c));
    });

    const selectedCoupon = computed(() => {
      if (!selectedCouponId.value) return null;
      return allCoupons.value.find(item => item.id === selectedCouponId.value) || null;
    });

    const couponDiscountAmount = computed(() => {
      return calculateCouponDiscount(selectedCoupon.value);
    });

    // ========== 礼品卡计算 ==========
    const selectedGiftCard = computed(() => {
      if (!selectedGiftCardCode.value) return null;
      return giftCards.value.find(c => c.code === selectedGiftCardCode.value || c.giftCardCode === selectedGiftCardCode.value) || null;
    });

    const giftCardDeductAmount = computed(() => {
      if (!selectedGiftCardCode.value) return 0;
      const card = selectedGiftCard.value;
      const balance = toNumber(card?.balance || card?.availableAmount || card?.amount || 0);
      if (balance <= 0) return 0;
      const afterCoupon = Math.max(0, goodsAmount.value + freightAmount.value - couponDiscountAmount.value);
      return Math.min(balance, afterCoupon);
    });

    const finalPayMoney = computed(() => {
      return Math.max(0, goodsAmount.value + freightAmount.value - couponDiscountAmount.value - giftCardDeductAmount.value);
    });

    // ========== 优惠券操作 ==========
    const selectCoupon = (coupon) => {
      if (!coupon) return;
      selectedCouponId.value = coupon.id;
      couponPanelVisible.value = false;
    };

    const clearCoupon = () => {
      selectedCouponId.value = null;
    };

    const exchangeCoupon = () => {
      if (!couponExchangeCode.value) return;
      exchangeMemberCoupon(couponExchangeCode.value).then(() => {
        Message({ type: "success", text: "兑换成功" });
        couponExchangeCode.value = "";
        loadCoupons();
      }).catch(() => {
        Message({ type: "error", text: "兑换失败，请检查兑换码" });
      });
    };

    // ========== 礼品卡操作 ==========
    const selectGiftCardFromList = (card) => {
      if (!card) return;
      selectedGiftCardCode.value = card.code || card.giftCardCode;
    };

    const useGiftCard = () => {
      if (!giftCardInput.value) return;
      const existing = giftCards.value.find(c => c.code === giftCardInput.value || c.giftCardCode === giftCardInput.value);
      if (existing) {
        selectedGiftCardCode.value = existing.code || existing.giftCardCode;
        giftCardInput.value = "";
        return;
      }
      bindGiftCard(giftCardInput.value).then(() => {
        Message({ type: "success", text: "绑定成功" });
        selectedGiftCardCode.value = giftCardInput.value;
        giftCardInput.value = "";
        loadGiftCards();
      }).catch(() => {
        Message({ type: "error", text: "礼品卡无效或绑定失败" });
      });
    };

    const clearGiftCard = () => {
      selectedGiftCardCode.value = null;
    };

    // 接收收货地址ID
    const changeAddress = (id) => {
      reqParams.addressId = id;
    };

    // 配送时间选择
    const deliveryTimeType = ref(1);
    const selectDeliveryTime = (n) => {
      deliveryTimeType.value = n;
      reqParams.deliveryTimeType = n;
    };

    // 支付方式选择
    const payType = ref(1);
    const selectPayType = (n) => {
      payType.value = n;
      reqParams.payType = n;
    };

    // ========== 实时金额计算 ==========

    const goodsAmount = computed(() => {
      const o = order.value || {};
      const s = o.summary || o.summaryInfo || {};
      return pickNumber(
        s.totalPrice, s.goodsAmount, s.goodsTotal, s.totalMoney, s.totalGoodsMoney,
        o.totalPrice, o.goodsAmount, o.goodsTotal, o.totalMoney, o.totalGoodsMoney,
        o.goodsPrice, o.total
      );
    });

    const baseFreightAmount = computed(() => {
      const o = order.value || {};
      const s = o.summary || o.summaryInfo || {};
      return pickOptionalNumber(
        s.postFee, s.freight, s.freightAmount, s.postage,
        o.postFee, o.freight, o.freightAmount, o.postage
      );
    });

    const codServiceFee = computed(() => {
      return payType.value === 2 ? 5 : 0;
    });

    const freightAmount = computed(() => {
      return baseFreightAmount.value + codServiceFee.value;
    });

    const summaryTotalPrice = computed(() => goodsAmount.value.toFixed(2));
    const summaryPostFee = computed(() => freightAmount.value.toFixed(2));

    const goodsEmpty = computed(() => {
      return !order.value || !order.value.goods || order.value.goods.length === 0;
    });

    const zeroPrice = computed(() => {
      if (!order.value) return false;
      return finalPayMoney.value <= 0;
    });

    const submitDisabled = computed(() => goodsEmpty.value);

    // ========== 结算提交参数 ==========
    const reqParams = reactive({
      deliveryTimeType: 1,
      payType: 1,
      payChannel: 1,
      buyerMessage: "",
      goods: [],
      addressId: null,
    });

    const stockText = (item) => {
      const availableStock = item.availableStock ?? 0;
      if (item.stockStatus === "OUT_OF_STOCK" || availableStock <= 0) {
        return "当前缺货";
      }
      if (item.stockStatus === "LOW_STOCK") {
        return `库存紧张，仅剩 ${availableStock} 件`;
      }
      return `库存 ${availableStock} 件`;
    };

    const stockClass = (item) => {
      const availableStock = item.availableStock ?? 0;
      if (item.stockStatus === "OUT_OF_STOCK" || availableStock <= 0) {
        return "out";
      }
      if (item.stockStatus === "LOW_STOCK") {
        return "low";
      }
      return "in";
    };

    const pollOrderProcess = (orderNo, payPrice) => {
      let count = 0;
      pollTimer = setInterval(async () => {
        count++;
        try {
          const res = await getOrderProcessAPI(orderNo);
          const status = res.result?.status;
          if (status === "SUCCESS") {
            clearInterval(pollTimer);
            pollTimer = null;
            processing.value = false;
            submitting.value = false;
            Message({ type: "success", text: "订单创建成功" });
            store.dispatch("cart/findCart");
            const orderId = res.result?.orderId;
            if (payType.value === 1 && payPrice > 0) {
              router.push(`/member/pay?orderId=${orderId || ""}&orderNo=${orderNo}`);
            } else {
              router.push(`/member/order/${orderId || orderNo}`);
            }
            return;
          }
          if (status === "FAILED") {
            clearInterval(pollTimer);
            pollTimer = null;
            processing.value = false;
            submitting.value = false;
            Message({ type: "error", text: res.result?.message || "订单创建失败，请稍后重试" });
            return;
          }
          if (res.result?.message) {
            processMessage.value = res.result.message;
          }
          if (count >= 30) {
            clearInterval(pollTimer);
            pollTimer = null;
            processing.value = false;
            submitting.value = false;
            Message({ type: "warn", text: "订单仍在处理中，请稍后在订单中心查看" });
          }
        } catch (err) {}
      }, 1000);
    };

    const submitSyncOrder = () => {
      const payPrice = parseFloat(finalPayMoney.value);
      submitting.value = true;
      submitOrder(reqParams)
        .then((data) => {
          submitting.value = false;
          if (!data || String(data.code) !== "20000") {
            Message({ type: "error", text: data?.msg || "提交订单失败" });
            return;
          }
          Message({ type: "success", text: "提交订单成功" });
          store.dispatch("cart/findCart");
          const orderId = data.result?.orderId || data.result?.id;
          const orderNo = data.result?.orderNo;
          if (payType.value === 1 && payPrice > 0) {
            router.push(`/member/pay?orderId=${orderId}&orderNo=${orderNo}`);
          } else {
            router.push(`/member/order/${orderId}`);
          }
        })
        .catch(() => {
          submitting.value = false;
          Message({ type: "error", text: "提交订单失败，请稍后重试" });
        });
    };

    const submitAsyncOrder = async () => {
      const payPrice = parseFloat(finalPayMoney.value);
      const asyncParams = {
        addressId: reqParams.addressId,
        goods: reqParams.goods,
        token: orderToken.value,
        payChannel: reqParams.payChannel,
        buyerMessage: reqParams.buyerMessage || "",
        deliveryTimeType: reqParams.deliveryTimeType,
      };
      if (selectedCouponId.value) {
        asyncParams.couponId = selectedCouponId.value;
      }
      if (selectedGiftCardCode.value) {
        asyncParams.giftCardCode = selectedGiftCardCode.value;
      }

      submitting.value = true;
      try {
        const data = await submitOrderAsyncAPI(asyncParams);
        if (!data || String(data.code) !== "20000") {
          submitting.value = false;
          if (data && String(data.code) === "40020") {
            loadOrderToken();
          }
          Message({ type: "error", text: data?.msg || "提交订单失败" });
          return;
        }
        processOrderNo.value = data.result.orderNo;
        processMessage.value = "订单正在创建中，请稍候...";
        submitting.value = false;
        processing.value = true;
        pollOrderProcess(data.result.orderNo, payPrice);
      } catch (err) {
        submitting.value = false;
        Message({ type: "error", text: "提交订单失败，请稍后重试" });
      }
    };

    const submitOrderFn = () => {
      if (!reqParams.addressId) {
        Message({ text: "请选择收货地址" });
        return;
      }
      if (!order.value?.goods?.length) {
        Message({ type: "warn", text: "没有可结算的商品" });
        return;
      }
      const invalidStockItem = order.value.goods.find((item) => item.count > (item.availableStock ?? 0));
      if (invalidStockItem) {
        Message({ type: "error", text: `商品"${invalidStockItem.name}"库存不足，请返回购物车调整` });
        return;
      }

      delete reqParams.couponId;
      delete reqParams.giftCardCode;
      if (selectedCouponId.value) {
        reqParams.couponId = selectedCouponId.value;
      }
      if (selectedGiftCardCode.value) {
        reqParams.giftCardCode = selectedGiftCardCode.value;
      }

      if (orderToken.value) {
        submitAsyncOrder();
      } else {
        submitSyncOrder();
      }
    };

    onBeforeUnmount(() => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    });

    return { order, allCoupons, usableCoupons, selectedCoupon, couponDiscountAmount,
  selectedGiftCard, giftCardDeductAmount, finalPayMoney,
  summaryTotalPrice, summaryPostFee, goodsEmpty, zeroPrice, submitDisabled,
	  goodsAmount, freightAmount, baseFreightAmount, codServiceFee,
  submitting, processing, processMessage, processOrderNo,
  changeAddress, deliveryTimeType, payType,
  selectDeliveryTime, selectPayType,
  submitOrderFn, formatAttrsText, formatMoney, stockText, stockClass,
  couponPanelVisible, couponExchangeCode, selectCoupon, clearCoupon, exchangeCoupon,
  giftCardInput, selectGiftCardFromList, useGiftCard, clearGiftCard,
  giftCards, selectedGiftCardCode,
};
  },
};
</script>
<style scoped lang="less">
.xtx-pay-checkout-page {
  .wrapper {
    background: #fff;
    padding: 0 20px;
    .box-title {
      font-size: 16px;
      font-weight: normal;
      padding-left: 10px;
      line-height: 70px;
      border-bottom: 1px solid #f5f5f5;
    }
    .box-body {
      padding: 20px 0;
    }
  }
}
.goods {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  .info {
    display: flex;
    text-align: left;
    img {
      width: 70px;
      height: 70px;
      margin-right: 20px;
    }
    .right {
      line-height: 24px;
      p {
        &:last-child {
          color: #999;
        }
      }
      .stock-line {
        &.in {
          color: #27ba9b;
        }
        &.low {
          color: #e6a23c;
        }
        &.out {
          color: #cf4444;
        }
      }
    }
  }
  tr {
    th {
      background: #f5f5f5;
      font-weight: normal;
    }
    td,
    th {
      text-align: center;
      padding: 20px;
      border-bottom: 1px solid #f5f5f5;
      &:first-child {
        border-left: 1px solid #f5f5f5;
      }
      &:last-child {
        border-right: 1px solid #f5f5f5;
      }
    }
  }
}
.my-btn {
  width: 228px;
  height: 50px;
  border: 1px solid #e4e4e4;
  text-align: center;
  line-height: 48px;
  margin-right: 25px;
  color: #666666;
  display: inline-block;
  &.active,
  &:hover {
    border-color: @xtxColor;
  }
}
.total {
  dl {
    display: flex;
    justify-content: flex-end;
    line-height: 50px;
    dt {
      i {
        display: inline-block;
        width: 2em;
      }
    }
    dd {
      width: 240px;
      text-align: right;
      padding-right: 70px;
      &.price {
        font-size: 20px;
        color: @priceColor;
      }
    }
  }
}
.submit {
  text-align: right;
  padding: 60px;
  border-top: 1px solid #f5f5f5;
  .empty-tip {
    color: #999;
    font-size: 14px;
    margin-top: 10px;
    text-align: right;
  }
}
.wrapper-empty {
  background: #fff;
  padding: 80px 20px;
  text-align: center;
  .empty-msg {
    font-size: 16px;
    color: #999;
  }
}
.coupon-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.coupon-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border: 1px solid #e4e4e4;
  border-radius: 4px;
  cursor: pointer;
  &.selected {
    border-color: @xtxColor;
  }
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  input {
    margin-right: 8px;
  }
}
.coupon-info {
  display: flex;
  flex-direction: column;
}
.coupon-name {
  font-weight: bold;
}
.coupon-desc {
  color: #999;
  font-size: 12px;
}
.coupon-amount {
  color: @priceColor;
  font-weight: bold;
}
.coupon-disabled-tip {
  color: #999;
  font-size: 11px;
}
.gift-card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.gift-card-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border: 1px solid #e4e4e4;
  border-radius: 4px;
  cursor: pointer;
  &.selected {
    border-color: @xtxColor;
  }
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  input {
    margin-right: 10px;
  }
}
.card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.card-name {
  font-weight: bold;
  font-size: 14px;
}
.card-code {
  color: #999;
  font-size: 12px;
}
.card-balance {
  color: @priceColor;
  font-weight: bold;
  font-size: 14px;
}
.gift-card-bind {
  margin-bottom: 12px;
  input {
    width: 200px;
    height: 34px;
    border: 1px solid #e4e4e4;
    border-radius: 4px;
    padding: 0 10px;
    margin-right: 8px;
  }
}

/* ====== 优惠券/礼品卡新样式 ====== */
.checkout-section.benefit-section {
  border-bottom: 1px solid #f5f5f5;
}
.benefit-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.benefit-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.benefit-name {
  font-weight: bold;
  color: #333;
}
.benefit-amount {
  color: @priceColor;
  font-weight: bold;
}
.benefit-empty {
  color: #999;
  font-size: 14px;
}
.benefit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 16px;
  background: @xtxColor;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}
.benefit-btn:hover {
  opacity: 0.9;
}
.benefit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.benefit-link {
  background: none;
  border: none;
  color: #27BA9B;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  white-space: nowrap;
}
.benefit-link:hover {
  color: #1e9a82;
}
.benefit-btn-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  background: @xtxColor;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.benefit-btn-sm:hover {
  opacity: 0.9;
}
.benefit-btn-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.benefit-empty-box {
  color: #999;
  font-size: 13px;
  padding: 8px 0;
}
.coupon-panel {
  margin-top: 12px;
  border: 1px solid #e4e4e4;
  border-radius: 4px;
  padding: 12px;
  background: #fafafa;
}
.coupon-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
  font-size: 14px;
}
.coupon-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 6px;
  background: #fff;
}
.coupon-list-info {
  flex: 1;
  min-width: 0;
}
.coupon-list-title {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}
.coupon-list-desc {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
.coupon-exchange {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  input {
    flex: 1;
    height: 32px;
    border: 1px solid #e4e4e4;
    border-radius: 4px;
    padding: 0 10px;
    font-size: 13px;
  }
}
.gift-card-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  input {
    flex: 1;
    max-width: 280px;
    height: 34px;
    border: 1px solid #e4e4e4;
    border-radius: 4px;
    padding: 0 10px;
    font-size: 14px;
  }
  input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
}
.gift-card-used {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: #f0fff0;
  border: 1px solid #b8e6b8;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
}
.gift-card-list-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.gift-card-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid #e4e4e4;
  border-radius: 4px;
  background: #fff;
}
.gift-card-code-text {
  font-size: 13px;
  color: #333;
  font-family: monospace;
}
.gift-card-balance-text {
  font-size: 13px;
  color: @priceColor;
  font-weight: bold;
}
.discount {
  color: @priceColor;
}
.cancel-link {
  font-size: 12px;
  color: #27BA9B;
  cursor: pointer;
  margin-left: 10px;
  font-weight: normal;
}
.cancel-link:hover {
  color: #1e9a82;
}
.processing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.processing-box {
  background: #fff;
  border-radius: 8px;
  padding: 40px 60px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.processing-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 20px;
  border: 4px solid #e4e4e4;
  border-top-color: @xtxColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.processing-text {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}
.processing-order {
  font-size: 14px;
  color: #999;
}
</style>
