# 🎬 Apple TV 风格视差按钮效果说明

## 📝 效果来源

参考网站：[CodeMyUI - Apple TV Style Parallax Button](https://codemyui.com/apple-tv-style-parallax-button-for-websites/)

这是 Apple TV 界面中经典的视差交互效果，当鼠标悬停在按钮上时，按钮会根据鼠标位置产生3D倾斜效果，并伴有光晕动画。

---

## ✨ 实现效果

已将此效果应用到首页的四个功能按钮：
- 🎯 **智能匹配**
- 🌧️ **表情雨**
- 🤖 **AI助手**
- 💬 **聊天**

### 视觉效果特性

1. **3D 倾斜效果**
   - 鼠标移动时，按钮会向鼠标方向倾斜
   - X轴倾斜范围：±10度
   - Y轴倾斜范围：±10度
   - 视角距离：1000px

2. **缩放效果**
   - 悬停时按钮会放大到 1.05 倍
   - 产生"浮起"的视觉感受

3. **动态光晕**
   - 跟随鼠标位置的径向渐变光晕
   - 白色半透明，中心亮度30%
   - 平滑的淡入淡出过渡

4. **深度阴影**
   - 悬停时阴影增强
   - 阴影颜色：粉色系 rgba(255, 182, 193, 0.3)
   - 阴影范围：0 15px 35px

---

## 🔧 技术实现

### HTML 结构变化

**之前：**
```html
<div class="feature-item" @click="handleSmartMatch">
  <div class="feature-icon">🎯</div>
  <span>智能匹配</span>
</div>
```

**之后：**
```html
<div 
  class="feature-item parallax-button" 
  @click="handleSmartMatch"
  @mousemove="handleParallaxMove"
  @mouseleave="handleParallaxLeave"
>
  <div class="parallax-content">
    <div class="feature-icon">🎯</div>
    <span>智能匹配</span>
  </div>
  <div class="parallax-shine"></div>
</div>
```

### JavaScript 逻辑

#### 1. `handleParallaxMove(event)` - 鼠标移动处理

```javascript
const handleParallaxMove = (event) => {
  const card = event.currentTarget
  const rect = card.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  // 计算倾斜角度
  const rotateX = ((y - centerY) / centerY) * -10
  const rotateY = ((x - centerX) / centerX) * 10
  
  // 应用3D变换
  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`
  
  // 光晕效果
  const shine = card.querySelector('.parallax-shine')
  if (shine) {
    const shineX = (x / rect.width) * 100
    const shineY = (y / rect.height) * 100
    shine.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.3) 0%, transparent 50%)`
    shine.style.opacity = '1'
  }
}
```

**工作原理：**
1. 获取鼠标相对于按钮的位置
2. 计算鼠标相对于按钮中心的偏移
3. 根据偏移量计算旋转角度
4. 应用3D透视变换
5. 更新光晕位置和透明度

#### 2. `handleParallaxLeave(event)` - 鼠标离开处理

```javascript
const handleParallaxLeave = (event) => {
  const card = event.currentTarget
  // 恢复原始状态
  card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  
  // 隐藏光晕
  const shine = card.querySelector('.parallax-shine')
  if (shine) {
    shine.style.opacity = '0'
  }
}
```

### CSS 样式

```css
/* 按钮容器 */
.parallax-button {
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;  /* 启用3D变换 */
  transition: transform 0.1s ease-out, box-shadow 0.3s ease;
  will-change: transform;  /* 性能优化 */
}

/* 内容层 */
.parallax-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  transform: translateZ(20px);  /* 内容向前偏移 */
}

/* 光晕层 */
.parallax-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 1;
  border-radius: var(--radius-card);
}

/* 悬停效果 */
.parallax-button:hover {
  box-shadow: 0 15px 35px rgba(255, 182, 193, 0.3);
}

/* 图标深度 */
.parallax-button .feature-icon {
  transform: translateZ(30px);  /* 图标最靠前 */
  filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.1));
}

/* 文字深度 */
.parallax-button span {
  transform: translateZ(20px);
}
```

---

## 🎨 效果演示

### 使用步骤

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **访问首页**
   ```
   http://localhost:5173/
   ```

3. **体验效果**
   - 将鼠标移动到任意功能按钮上
   - 在按钮区域内移动鼠标
   - 观察按钮的3D倾斜效果和光晕动画

### 预期效果

#### 静态状态
```
┌─────────────┐
│   🎯       │
│ 智能匹配    │
└─────────────┘
```

#### 鼠标在左上角
```
    ┌─────────────┐
   ↗│ ✨🎯       │
  /  │ 智能匹配    │
     └─────────────┘
（向右下倾斜，左上角有光晕）
```

#### 鼠标在右下角
```
┌─────────────┐
│   🎯✨      │↘
│ 智能匹配    │  \
└─────────────┘
（向左上倾斜，右下角有光晕）
```

---

## 🎯 效果参数调整

如果您想调整效果强度，可以修改以下参数：

### 1. 倾斜角度（`HomePage.vue` 第630-631行）

```javascript
// 当前值：±10度
const rotateX = ((y - centerY) / centerY) * -10  // 改为 -15 增强上下倾斜
const rotateY = ((x - centerX) / centerX) * 10   // 改为 15 增强左右倾斜
```

### 2. 缩放比例（第633行）

```javascript
// 当前值：1.05倍
scale3d(1.05, 1.05, 1.05)  // 改为 (1.1, 1.1, 1.1) 放大更多
```

### 3. 光晕强度（第640行）

```javascript
// 当前值：30%透明度
rgba(255,255,255,0.3)  // 改为 0.5 增强光晕亮度
```

### 4. 视角距离（CSS）

```css
/* 当前值：1000px */
perspective(1000px)  /* 改为 800px 增强3D效果 */
```

### 5. 过渡速度（CSS）

```css
/* 当前值：0.1s */
transition: transform 0.1s ease-out;  /* 改为 0.2s 放慢动画 */
```

---

## 📱 移动端适配

视差效果在移动端会自动禁用（因为没有鼠标悬停），但点击交互依然正常工作。

如果想在移动端启用触摸版本的视差效果，可以添加：

```javascript
// 触摸版本（可选）
const handleTouchMove = (event) => {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    // 使用触摸坐标模拟鼠标移动
    const fakeEvent = {
      currentTarget: event.currentTarget,
      clientX: touch.clientX,
      clientY: touch.clientY
    }
    handleParallaxMove(fakeEvent)
  }
}
```

---

## 🔍 浏览器兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11（不支持3D变换）

---

## ⚡ 性能优化

已采用的优化措施：

1. **will-change** 属性
   ```css
   will-change: transform;
   ```
   提前通知浏览器元素会变化，启用GPU加速

2. **transform 而非 position**
   使用 transform 而不是 top/left，避免重排

3. **pointer-events: none**
   ```css
   .parallax-content {
     pointer-events: none;
   }
   ```
   防止内容阻挡鼠标事件

4. **节流（可选）**
   如果感觉卡顿，可以添加节流：
   ```javascript
   import { throttle } from 'lodash-es'
   
   const handleParallaxMove = throttle((event) => {
     // ... 原有代码
   }, 16) // 约60fps
   ```

---

## 🐛 常见问题

### 1. 效果不生效？

**检查：**
- 确保浏览器支持3D变换
- 查看控制台是否有JavaScript错误
- 确认鼠标事件监听器已绑定

### 2. 效果太强/太弱？

**解决：**
- 调整倾斜角度参数（见上方"效果参数调整"）

### 3. 移动端无效果？

**说明：**
- 这是正常的，移动端没有鼠标悬停
- 如需移动端效果，可添加触摸事件（见上方"移动端适配"）

### 4. 光晕不显示？

**检查：**
- `.parallax-shine` 元素是否存在
- opacity 是否正确设置
- z-index 层级是否正确

---

## 🎉 效果对比

### 修改前
- ❌ 简单的 hover 悬浮
- ❌ 无3D效果
- ❌ 无光晕动画

### 修改后
- ✅ Apple TV 风格3D倾斜
- ✅ 跟随鼠标的视差效果
- ✅ 动态光晕动画
- ✅ 深度感和立体感
- ✅ 流畅的过渡动画

---

## 🔗 相关资源

- [原始效果演示](https://codemyui.com/apple-tv-style-parallax-button-for-websites/)
- [CodePen Demo](https://codepen.io/filipdanisko/pen/oPBRYL)
- [CSS 3D Transforms MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)

---

**享受您的 Apple TV 风格按钮效果！** 🎬✨

如有任何问题或需要进一步调整，请随时告知。


