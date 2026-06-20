<template>
  <RouterLink :to="`/product/${goods.id}`" class="goods-item">
    <img v-img-error :src="goods.picture" alt="" />
    <p class="name ellipsis">{{ goods.name }}</p>
    <p class="desc ellipsis">{{ goods.desc }}</p>
    <p class="stock" :class="stockClass">{{ stockText }}</p>
    <p class="price">&yen;{{ goods.price }}</p>
  </RouterLink>
</template>

<script>
export default {
  name: "GoodsItem",
  props: {
    goods: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    stockText() {
      const availableStock = this.goods.availableStock ?? this.goods.inventory ?? 0;
      if (this.goods.stockStatus === "OUT_OF_STOCK" || availableStock <= 0) {
        return "缺货";
      }
      if (this.goods.stockStatus === "LOW_STOCK") {
        return `库存紧张，仅剩 ${availableStock} 件`;
      }
      return `库存 ${availableStock} 件`;
    },
    stockClass() {
      if (this.goods.stockStatus === "OUT_OF_STOCK") {
        return "out";
      }
      if (this.goods.stockStatus === "LOW_STOCK") {
        return "low";
      }
      return "in";
    },
  },
};
</script>

<style scoped lang="less">
.goods-item {
  display: block;
  width: 220px;
  padding: 20px 30px;
  text-align: center;
  .hoverShadow();
  img {
    width: 160px;
    height: 160px;
  }
  p {
    padding-top: 10px;
  }
  .name {
    font-size: 16px;
  }
  .desc {
    color: #999;
    height: 29px;
  }
  .stock {
    font-size: 13px;
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
  .price {
    color: @priceColor;
    font-size: 20px;
  }
}
</style>
