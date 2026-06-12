async function uploadImage() {
  const file = document.getElementById("upload").files[0];

  if (!file) {
    alert("Please upload an image");
    return;
  }

  // 模擬 AI 修復（之後換成 API）
  const reader = new FileReader();

  reader.onload = function(e) {
    document.getElementById("result").src = e.target.result;
  };

  reader.readAsDataURL(file);
}
