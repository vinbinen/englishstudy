// image-processor.js
self.addEventListener('message', async (e) => {
  const { imageData, config } = e.data;
  const startTime = performance.now();
  try {
    // 从 ImageData 构造 Mat 对象
    let src = cv.matFromImageData(imageData);
    
    // 转为灰度图像
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    
    // 高斯模糊，平滑噪声
    let blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    
    // 自适应阈值二值化
    let binary = new cv.Mat();
    cv.adaptiveThreshold(
      blurred,
      binary,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY_INV,
      config.adaptiveThreshold.blockSize,
      config.adaptiveThreshold.C
    );
    
    // 形态学闭操作：降噪和填充空洞
    let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(config.morphology.kernelSize, config.morphology.kernelSize));
    let morphed = new cv.Mat();
    cv.morphologyEx(binary, morphed, cv.MORPH_CLOSE, kernel, new cv.Point(-1, -1), config.morphology.iterations);
    
    // 检测轮廓以寻找答题卡区域
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(morphed, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    let maxArea = 0;
    let answerSheetContour = null;
    // 遍历所有轮廓，寻找面积最大且近似为四边形的轮廓
    for (let i = 0; i < contours.size(); i++) {
      let cnt = contours.get(i);
      let area = cv.contourArea(cnt, false);
      if (area > maxArea) {
        let approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt, true), true);
        if (approx.rows === 4) {
          maxArea = area;
          // 保留四个顶点的近似结果
          if (answerSheetContour !== null) answerSheetContour.delete();
          answerSheetContour = approx;
        } else {
          approx.delete();
        }
      }
      cnt.delete();
    }
    
    let processed = new cv.Mat();
    if (answerSheetContour !== null) {
      // 将检测到的四边形顶点提取为数组
      let points = [];
      for (let i = 0; i < 4; i++) {
        points.push({
          x: answerSheetContour.intAt(i, 0),
          y: answerSheetContour.intAt(i, 1)
        });
      }
      answerSheetContour.delete();
      
      // 对顶点排序：先根据坐标和排序，保证顺序为 [top-left, top-right, bottom-right, bottom-left]
      points.sort((a, b) => (a.x + a.y) - (b.x + b.y));
      let tl = points[0], br = points[3];
      // 根据横纵差值确定另外两个角点
      let diffSorted = [...points].sort((a, b) => (a.y - a.x) - (b.y - b.x));
      let tr = diffSorted[0], bl = diffSorted[3];
      
      // 计算目标图像尺寸（宽、高取两个边长中的最大值）
      let dstWidth = Math.max(
        Math.hypot(br.x - bl.x, br.y - bl.y),
        Math.hypot(tr.x - tl.x, tr.y - tl.y)
      );
      let dstHeight = Math.max(
        Math.hypot(tr.x - br.x, tr.y - br.y),
        Math.hypot(tl.x - bl.x, tl.y - bl.y)
      );
      
      let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y
      ]);
      let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0, dstWidth, 0, dstWidth, dstHeight, 0, dstHeight
      ]);
      
      // 获取透视变换矩阵
      let M = cv.getPerspectiveTransform(srcTri, dstTri);
      cv.warpPerspective(src, processed, M, new cv.Size(dstWidth, dstHeight), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
      
      srcTri.delete();
      dstTri.delete();
      M.delete();
    } else {
      // 未检测到明显答题卡区域，直接返回预处理结果作为后备
      processed = morphed.clone();
    }
    
    // 若处理结果为彩色，则转换为灰度
    let processedGray = new cv.Mat();
    if (processed.channels() > 1) {
      cv.cvtColor(processed, processedGray, cv.COLOR_RGBA2GRAY);
    } else {
      processedGray = processed.clone();
    }
    
    // 将处理后的 Mat 转换为 ImageData 格式
    let processedImageData = new ImageData(new Uint8ClampedArray(processedGray.data), processedGray.cols, processedGray.rows);
    
    // 资源释放
    src.delete(); gray.delete(); blurred.delete(); binary.delete(); morphed.delete();
    contours.delete(); hierarchy.delete(); processed.delete(); processedGray.delete(); kernel.delete();
    
    const processTime = performance.now() - startTime;
    console.log(`Worker processing time: ${processTime}ms`);
    self.postMessage({ processedImageData, processTime });
  } catch (error) {
    console.error("Worker处理出错:", error);
    self.postMessage(null);
  }
});
