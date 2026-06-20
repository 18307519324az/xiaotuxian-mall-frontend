<template>
  <div class="xtx-pay-checkout-page">
    <div class="container">
      <XtxBread>
        <XtxBreadItem to="/">首页</XtxBreadItem>
        <XtxBreadItem to="/cart">购物车</XtxBreadItem>
        <XtxBreadItem>填写订单</XtxBreadItem>
      </XtxBread>

      <div v-if="order" class="wrapper">
        <h3 class="box-title">收货地址</h3>
        <div class="box-body">
          <CheckoutAddress :list="order.userAddresses || []" @change="changeAddress" />
        </div>

        <h3 class="box-title">商品信息</h3>
        <div class="box-body">
          <table class="goods">
            <thead>
              <tr>
                <th width="520">商品信息</th>
                <th width="160">单价</th>
                <th width="120">数量</th>
                <th width="160">小计</th>
                <th width="180">库存</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in order.goods || []" :key="item.skuId">
                <td>
                  <div class="info">
                    <img :src="item.picture" alt="" />
                    <div class="meta">
                      <p>{{ item.name }}</p>
                      <p class="attrs">{{ formatAttrsText(item.attrsText) }}</p>
                    </div>
                  </div>
                </td>
                <td>¥{{ item.price }}</td>
                <td>{{ item.count }}</td>
                <td>¥{{ item.totalPrice }}</td>
                <td>
                  <p class="stock-line" :class="stockClass(item)">{{ stockText(item) }}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 class="box-title">配送时间</h3>
        <div class="box-body actions">
          <a class="my-btn" :class="{ active: deliveryTimeType === 1 }" href="javascript:;" @click="selectDeliveryTime(1)">不限送货时间</a>
          <a class="my-btn" :class="{ active: deliveryTimeType === 2 }" href="javascript:;" @click="selectDeliveryTime(2)">工作日送货</a>
          <a class="my-btn" :class="{ active: deliveryTimeType === 3 }" href="javascript:;" @click="selectDeliveryTime(3)">双休日送货</a>
        </div>

        <h3 class="box-title">支付方式</h3>
        <div class="box-body actions">
          <a class="my-btn" :class="{ active: payType === 1 }" href="javascript:;" @click="selectPayType(1)">在线支付</a>
          <a class="my-btn" :class="{ active: payType === 2 }" href="javascript:;" @click="selectPayType(2)">货到付款</a>
        </div>

        <h3 class="box-title">金额明细</h3>
        <div class="box-body">
          <div class="total">
            <dl>
              <dt>商品金额：</dt>
              <dd>¥{{ summaryTotalPrice }}</dd>
            </dl>
            <dl>
              <dt>运费：</dt>
              <dd>¥{{ summaryPostFee }}</dd>
            </dl>
            <dl>
              <dt>应付总额：</dt>
              <dd class="price">¥{{ finalPayPrice }}</dd>
            </dl>
          </div>
        </div>

        <div class="submit">
          <XtxButton type="primary" :disabled="submitDisabled || submitting || processing" @click="submitOrderFn">
            {{ submitting ? "正在提交..." : processing ? "订单处理中..." : "提交订单" }}
          </XtxButton>
          <p v-if="goodsEmpty" class="empty-tip">没有可结算的商品，请先返回购物车选择商品</p>
          <p v-if="processing" class="empty-tip">{{ processMessage }}</p>
        </div>
      </div>

      <div v-else class="wrapper-empty">
        <p class="empty-msg">订单加载中...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import CheckoutAddress from "./components/checkout-address";
import { createOrder, repurchaseOrder, submitOrder, submitOrderAsyncAPI, getOrderProcessAPI, getOrderTokenAPI } from "@/api/order";
import { formatAttrsText } from "@/utils/format";
import Message from "@/components/library/Message";

export default {
  name: "XtxPayCheckoutStage1Page",
  components: { CheckoutAddress },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();

    const order = ref(null);
    const deliveryTimeType = ref(1);
    const payType = ref(1);
    const submitting = ref(false);
    const processing = ref(false);
    const processMessage = ref("");
    const orderToken = ref("");
    let pollTimer = null;

    const reqParams = reactive({
      deliveryTimeType: 1,
      payType: 1,
      payChannel: 1,
      buyerMessage: "",
      goods: [],
      addressId: null,
    });

    const summaryTotalPrice = computed(() => {
      if (!order.value?.summary) return "0.00";
      return parseFloat(order.value.summary.totalPrice || "0").toFixed(2);
    });

    const summaryPostFee = computed(() => {
      if (!order.value?.summary) return "0.00";
      const base = parseFloat(order.value.summary.postFee || "0");
      return (payType.value === 2 ? base + 5 : base).toFixed(2);
    });

    const finalPayPrice = computed(() => {
      const goodsAmount = parseFloat(summaryTotalPrice.value || "0");
      const postFee = parseFloat(summaryPostFee.value || "0");
      return (goodsAmount + postFee).toFixed(2);
    });

    const goodsEmpty = computed(() => !order.value?.goods?.length);
    const submitDisabled = computed(() => goodsEmpty.value);

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

    const applyOrderPreview = (data) => {
      order.value = data.result;
      reqParams.goods = (data.result.goods || []).map(({ skuId, count }) => ({ skuId, count }));
      const defaultAddress =
        data.result.userAddresses?.find((item) => item.isDefault === 0) ||
        data.result.userAddresses?.[0] ||
        null;
      reqParams.addressId = defaultAddress ? defaultAddress.id : null;
    };

    const loadOrderPreview = () => {
      const request = route.query.orderId ? repurchaseOrder(route.query.orderId) : createOrder();
      request
        .then((data) => {
          applyOrderPreview(data);
        })
        .catch(() => {
          Message({ type: "error", text: "结算信息加载失败" });
          order.value = {
            userAddresses: [],
            goods: [],
            summary: { totalPrice: "0.00", postFee: "0.00" },
          };
        });
    };

    const loadOrderToken = () => {
      getOrderTokenAPI()
        .then((data) => {
          if (data?.result?.token) {
            orderToken.value = data.result.token;
          }
        })
        .catch(() => {});
    };

    const changeAddress = (id) => {
      reqParams.addressId = id;
    };

    const selectDeliveryTime = (value) => {
      deliveryTimeType.value = value;
      reqParams.deliveryTimeType = value;
    };

    const selectPayType = (value) => {
      payType.value = value;
      reqParams.payType = value;
    };

    const pollOrderProcess = (orderNo, payPrice) => {
      let count = 0;
      pollTimer = setInterval(async () => {
        count++;
        try {
          const res = await getOrderProcessAPI(orderNo);
          if (res.result?.status === "SUCCESS") {
            clearInterval(pollTimer);
            pollTimer = null;
            processing.value = false;
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
          if (res.result?.status === "FAILED") {
            clearInterval(pollTimer);
            pollTimer = null;
            processing.value = false;
            Message({ type: "error", text: res.result?.message || "订单创建失败，请稍后重试" });
            return;
          }
          processMessage.value = res.result?.message || "订单处理中...";
          if (count >= 30) {
            clearInterval(pollTimer);
            pollTimer = null;
            processing.value = false;
            Message({ type: "warn", text: "订单仍在处理中，请稍后在订单中心查看" });
          }
        } catch (err) {}
      }, 1000);
    };

    const submitSyncOrder = () => {
      const payPrice = parseFloat(finalPayPrice.value);
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
      const payPrice = parseFloat(finalPayPrice.value);
      submitting.value = true;
      try {
        const data = await submitOrderAsyncAPI({
          addressId: reqParams.addressId,
          goods: reqParams.goods,
          token: orderToken.value,
          payChannel: reqParams.payChannel,
          buyerMessage: reqParams.buyerMessage,
          deliveryTimeType: reqParams.deliveryTimeType,
        });
        submitting.value = false;
        if (!data || String(data.code) !== "20000") {
          Message({ type: "error", text: data?.msg || "提交订单失败" });
          return;
        }
        processing.value = true;
        processMessage.value = "订单正在创建中，请稍候...";
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

    loadOrderPreview();
    loadOrderToken();

    return {
      order,
      deliveryTimeType,
      payType,
      summaryTotalPrice,
      summaryPostFee,
      finalPayPrice,
      goodsEmpty,
      submitDisabled,
      submitting,
      processing,
      processMessage,
      changeAddress,
      selectDeliveryTime,
      selectPayType,
      submitOrderFn,
      stockText,
      stockClass,
      formatAttrsText,
    };
  },
};
</script>

<style scoped lang="less">
.xtx-pay-checkout-page {
  .wrapper {
    background: #fff;
    padding: 0 20px 20px;
  }
}

.box-title {
  font-size: 16px;
  font-weight: normal;
  line-height: 70px;
  border-bottom: 1px solid #f5f5f5;
}

.box-body {
  padding: 20px 0;
}

.goods {
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    border: 1px solid #f5f5f5;
    padding: 16px;
    text-align: center;
  }
}

.info {
  display: flex;
  align-items: center;
  text-align: left;

  img {
    width: 70px;
    height: 70px;
    margin-right: 16px;
  }
}

.meta {
  .attrs {
    color: #999;
    margin-top: 6px;
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

.actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.my-btn {
  width: 200px;
  height: 44px;
  border: 1px solid #e4e4e4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #666;

  &.active {
    border-color: @xtxColor;
    color: @xtxColor;
  }
}

.total {
  dl {
    display: flex;
    justify-content: flex-end;
    line-height: 42px;
  }

  dt {
    width: 120px;
    text-align: right;
  }

  dd {
    width: 180px;
    text-align: right;
  }

  .price {
    color: @priceColor;
    font-size: 20px;
  }
}

.submit {
  text-align: right;
  padding-top: 24px;

  .empty-tip {
    color: #999;
    margin-top: 10px;
  }
}

.wrapper-empty {
  background: #fff;
  padding: 80px 20px;
  text-align: center;
}
</style>
