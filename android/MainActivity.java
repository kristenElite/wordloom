package app.wordloom.vocabulary;
import android.app.*;import android.os.*;import android.content.*;import android.webkit.*;import android.net.Uri;import org.json.JSONObject;import java.io.*;
public class MainActivity extends Activity {
 boolean focusWindow;
 boolean supportsFocusWindow(){return android.os.Build.VERSION.SDK_INT>=26&&getPackageManager().hasSystemFeature("android.software.picture_in_picture");}
 void openFocusWindow(){
  try {
   PictureInPictureParams options=new PictureInPictureParams.Builder().setAspectRatio(new android.util.Rational(9,16)).build();
   if(!enterPictureInPictureMode(options))js("tell('请在系统设置允许此 App 使用画中画')");
  }catch(Exception unavailable){js("tell('无法打开小窗，请检查系统的画中画设置')");}
 }
 @Override public void onPictureInPictureModeChanged(boolean active,android.content.res.Configuration config){super.onPictureInPictureModeChanged(active,config);focusWindow=active;js("window.focusPipChanged?.("+active+")");}
 WebView web,printWeb;String backup;byte[] exportBytes;
 public void onCreate(Bundle b){super.onCreate(b);setupVoice();web=new WebView(this);android.widget.FrameLayout content=new android.widget.FrameLayout(this);content.setBackgroundColor(0xff100e1a);content.addView(web,new android.widget.FrameLayout.LayoutParams(-1,-1));web.setBackgroundColor(0);setContentView(content);web.getSettings().setSupportZoom(false);web.getSettings().setBuiltInZoomControls(false);web.getSettings().setDisplayZoomControls(false);web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.getSettings().setAllowFileAccess(true);web.getSettings().setAllowFileAccessFromFileURLs(false);web.getSettings().setAllowUniversalAccessFromFileURLs(false);web.addJavascriptInterface(new Bridge(),"WordloomAndroid");web.setWebViewClient(new WebViewClient(){public boolean shouldOverrideUrlLoading(WebView v,String u){return true;}public void onPageFinished(WebView v,String u){String text=getIntent().getStringExtra(Intent.EXTRA_TEXT);if(text!=null){js("receiveSharedWord("+JSONObject.quote(text)+")");getIntent().removeExtra(Intent.EXTRA_TEXT);}}});web.setWebChromeClient(new WebChromeClient(){public boolean onJsConfirm(WebView v,String url,String message,final JsResult r){new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("确定",(d,w)->r.confirm()).setNegativeButton("取消",(d,w)->r.cancel()).setOnCancelListener(d->r.cancel()).show();return true;}});web.loadUrl("file:///android_asset/Wordloom.html");}
 synchronized javax.crypto.SecretKey secret() throws Exception {java.security.KeyStore ks=java.security.KeyStore.getInstance("AndroidKeyStore");ks.load(null);if(!ks.containsAlias("wordloom-api")){javax.crypto.KeyGenerator gen=javax.crypto.KeyGenerator.getInstance("AES","AndroidKeyStore");gen.init(new android.security.keystore.KeyGenParameterSpec.Builder("wordloom-api",3).setBlockModes("GCM").setEncryptionPaddings("NoPadding").build());gen.generateKey();}return (javax.crypto.SecretKey)ks.getKey("wordloom-api",null);}
 android.speech.tts.TextToSpeech englishVoice;
 boolean voiceReady, americanMaleVoice;
 void speak(String text){
  if(!voiceReady){js("tell('英语语音尚未就绪，请检查手机的文字转语音设置')");return;}
  if(!americanMaleVoice){js("tell('手机当前没有可用的美式男声。可在系统文字转语音设置中安装英语（美国）男声。')");return;}
  int result=englishVoice.speak(text.substring(0,Math.min(3500,text.length())),android.speech.tts.TextToSpeech.QUEUE_FLUSH,null,"wordloom-reading");
  if(result==android.speech.tts.TextToSpeech.ERROR)js("tell('无法播放英文语音')");
 }
 void setupVoice(){
  String google="com.google.android.tts";
  Intent service=new Intent(android.speech.tts.TextToSpeech.Engine.INTENT_ACTION_TTS_SERVICE).setPackage(google);
  String preferred=getPackageManager().queryIntentServices(service,0).isEmpty()?null:google;
  initVoice(preferred);
 }
 void initVoice(String engine){
  englishVoice=new android.speech.tts.TextToSpeech(this,status->runOnUiThread(()->{
   if(isDestroyed()||englishVoice==null)return;
   if(status!=android.speech.tts.TextToSpeech.SUCCESS){if(engine!=null){englishVoice.shutdown();initVoice(null);}return;}
   voiceReady=englishVoice.setLanguage(java.util.Locale.US)>=0;
   americanMaleVoice=chooseAmericanVoice();
   englishVoice.setSpeechRate(.94f);
  }),engine);
 }
 boolean chooseAmericanVoice(){
  java.util.Set<android.speech.tts.Voice> voices=englishVoice.getVoices();if(voices==null)return false;
  String[] preferred={"en-us-x-iom-local","en-us-x-tpd-local","en-us-x-iom-network","en-us-x-tpd-network"};
  for(String name:preferred)for(android.speech.tts.Voice voice:voices)if(name.equalsIgnoreCase(voice.getName())&&!voice.getFeatures().contains("notInstalled")&&englishVoice.setVoice(voice)==0)return true;
  for(android.speech.tts.Voice voice:voices)if(java.util.Locale.US.equals(voice.getLocale())&&voice.getName().toLowerCase(java.util.Locale.ROOT).matches(".*(?:\\bmale\\b|\\bmatthew\\b|\\bdavid\\b).*" )&&!voice.getFeatures().contains("notInstalled")&&englishVoice.setVoice(voice)==0)return true;
  return false;
 }
 protected void onDestroy(){if(englishVoice!=null){englishVoice.stop();englishVoice.shutdown();englishVoice=null;}super.onDestroy();}
 void readJournalPhotos(java.util.List<Uri> photos){new Thread(()->{
  boolean failed=false;for(Uri uri:photos){
  try(ByteArrayOutputStream bytes=new ByteArrayOutputStream()){
   android.graphics.BitmapFactory.Options options=new android.graphics.BitmapFactory.Options();
   options.inJustDecodeBounds=true;
   try(InputStream input=getContentResolver().openInputStream(uri)){android.graphics.BitmapFactory.decodeStream(input,null,options);}
   if(options.outWidth<=0||options.outHeight<=0)throw new IOException("Unsupported photo");
   options.inSampleSize=1;
   while(Math.max(options.outWidth,options.outHeight)/options.inSampleSize>2400)options.inSampleSize*=2;
   options.inJustDecodeBounds=false;
   android.graphics.Bitmap bitmap;
   try(InputStream input=getContentResolver().openInputStream(uri)){bitmap=android.graphics.BitmapFactory.decodeStream(input,null,options);}
   if(bitmap==null)throw new IOException("Unsupported photo");
   android.graphics.Bitmap output=bitmap;
   try{
    final int orientation=readPhotoOrientation(uri);android.graphics.Matrix matrix=new android.graphics.Matrix();
    if(orientation==2||orientation==4||orientation==5||orientation==7)matrix.postScale(-1,1);
    if(orientation==3||orientation==4)matrix.postRotate(180);
    else if(orientation==5||orientation==6)matrix.postRotate(90);
    else if(orientation==7||orientation==8)matrix.postRotate(270);
    float scale=Math.min(1f,1440f/Math.max(bitmap.getWidth(),bitmap.getHeight()));matrix.postScale(scale,scale);
    if(!matrix.isIdentity())output=android.graphics.Bitmap.createBitmap(bitmap,0,0,bitmap.getWidth(),bitmap.getHeight(),matrix,true);
    if(!output.compress(android.graphics.Bitmap.CompressFormat.JPEG,86,bytes))throw new IOException("JPEG conversion failed");
   }finally{if(output!=bitmap)output.recycle();bitmap.recycle();}
   js("receiveJournalPhoto("+JSONObject.quote(android.util.Base64.encodeToString(bytes.toByteArray(),2))+",'image/jpeg',false)");
  }catch(Exception e){failed=true;}}
  js("receiveJournalPhoto(null)"+(failed?";tell('部分照片无法读取，请尝试 JPG、PNG 或 WebP')":""));
 }).start();}
 int readPhotoOrientation(Uri uri){try(InputStream input=getContentResolver().openInputStream(uri)){return new android.media.ExifInterface(input).getAttributeInt(android.media.ExifInterface.TAG_ORIENTATION,1);}catch(Exception unavailable){return 1;}}
 int journalPhotoLimit=20;
 void launchPhotoPicker(int remaining){
  journalPhotoLimit=Math.max(1,Math.min(20,remaining));
  Intent picker=new Intent("android.provider.action.PICK_IMAGES").setType("image/*");
  if(journalPhotoLimit>1)picker.putExtra("android.provider.extra.PICK_IMAGES_MAX",journalPhotoLimit);
  try{startActivityForResult(picker,13);return;}catch(ActivityNotFoundException unavailable){}
  Intent album=new Intent("androidx.activity.result.contract.action.PICK_IMAGES").setType("image/*");
  if(journalPhotoLimit>1)album.putExtra("androidx.activity.result.contract.extra.PICK_IMAGES_MAX",journalPhotoLimit);
  try{startActivityForResult(album,13);return;}catch(ActivityNotFoundException unavailable){}
  if(Build.VERSION.SDK_INT<=32){
   if(checkSelfPermission(android.Manifest.permission.READ_EXTERNAL_STORAGE)!=android.content.pm.PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{android.Manifest.permission.READ_EXTERNAL_STORAGE},14);
   else LocalPhotoAlbum.show(this,journalPhotoLimit,this::readJournalPhotos);
   return;
  }
  Intent fallback=new Intent(Intent.ACTION_GET_CONTENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE);
  fallback.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,journalPhotoLimit>1);
  try{startActivityForResult(fallback,13);}catch(ActivityNotFoundException unavailable){js("receiveJournalPhoto(null);tell('无法打开相册')");}
 }
 @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] grants){super.onRequestPermissionsResult(request,permissions,grants);if(request!=14)return;if(grants.length>0&&grants[0]==android.content.pm.PackageManager.PERMISSION_GRANTED)LocalPhotoAlbum.show(this,journalPhotoLimit,this::readJournalPhotos);else js("receiveJournalPhoto(null);tell('允许访问照片后可打开相册')");}
 public class Bridge{
 @JavascriptInterface public boolean supportsFocusWindow(){return MainActivity.this.supportsFocusWindow();}
 @JavascriptInterface public void openFocusWindow(){runOnUiThread(()->MainActivity.this.openFocusWindow());}
 @JavascriptInterface public void speakEnglish(String text){runOnUiThread(()->speak(text));}
 @JavascriptInterface public void pickJournalPhoto(int remaining){runOnUiThread(()->launchPhotoPicker(remaining));}

 @JavascriptInterface public void keepAwake(boolean enabled){runOnUiThread(()->{if(enabled)getWindow().addFlags(128);else getWindow().clearFlags(128);});}

 @JavascriptInterface public boolean saveKey(String value){try{if(value.isEmpty())return getSharedPreferences("secure",0).edit().clear().commit();javax.crypto.Cipher c=javax.crypto.Cipher.getInstance("AES/GCM/NoPadding");c.init(javax.crypto.Cipher.ENCRYPT_MODE,secret());String blob=android.util.Base64.encodeToString(c.doFinal(value.getBytes("UTF-8")),2),iv=android.util.Base64.encodeToString(c.getIV(),2);return getSharedPreferences("secure",0).edit().putString("blob",blob).putString("iv",iv).commit();}catch(Exception e){return false;}}
 @JavascriptInterface public String readKey(){try{android.content.SharedPreferences p=getSharedPreferences("secure",0);String b=p.getString("blob","");if(b.isEmpty())return "";javax.crypto.Cipher c=javax.crypto.Cipher.getInstance("AES/GCM/NoPadding");c.init(javax.crypto.Cipher.DECRYPT_MODE,secret(),new javax.crypto.spec.GCMParameterSpec(128,android.util.Base64.decode(p.getString("iv",""),2)));return new String(c.doFinal(android.util.Base64.decode(b,2)),"UTF-8");}catch(Exception e){return "";}}

 @JavascriptInterface public void generate(String payload,String key){new Thread(()->{org.json.JSONObject result=new org.json.JSONObject();javax.net.ssl.HttpsURLConnection c=null;try{c=(javax.net.ssl.HttpsURLConnection)new java.net.URL("https://api.deepseek.com/chat/completions").openConnection();c.setInstanceFollowRedirects(false);c.setConnectTimeout(15000);c.setReadTimeout(90000);c.setRequestMethod("POST");c.setRequestProperty("Content-Type","application/json");c.setRequestProperty("Authorization","Bearer "+key);c.setDoOutput(true);try(OutputStream out=c.getOutputStream()){out.write(payload.getBytes("UTF-8"));}int status=c.getResponseCode();result.put("status",status);if(status==200){try(InputStream in=c.getInputStream()){ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buf=new byte[8192];int n;while((n=in.read(buf))!=-1){out.write(buf,0,n);if(out.size()>2000000)throw new IOException();}result.put("data",new org.json.JSONObject(out.toString("UTF-8")));}}}catch(Exception e){try{result.put("error","连接 DeepSeek 失败或超时，请检查网络后重试");}catch(Exception ignored){}}finally{if(c!=null)c.disconnect();}final String data=result.toString();runOnUiThread(()->js("receiveAI("+data+")"));}).start();}

 @JavascriptInterface public void exportBackup(String text){backup=text;runOnUiThread(()->{Intent i=new Intent("android.intent.action.CREATE_DOCUMENT");i.setType("application/json");i.addCategory(Intent.CATEGORY_OPENABLE);i.putExtra(Intent.EXTRA_TITLE,"wordloom-backup.json");startActivityForResult(i,10);});}
 @JavascriptInterface public void exportDocument(String encoded,String name,String mime){try{exportBytes=android.util.Base64.decode(encoded,2);runOnUiThread(()->{Intent i=new Intent("android.intent.action.CREATE_DOCUMENT");i.setType(mime);i.addCategory(Intent.CATEGORY_OPENABLE);i.putExtra(Intent.EXTRA_TITLE,name);startActivityForResult(i,12);});}catch(Exception e){js("tell('文档导出失败，请重试')");}}
 @JavascriptInterface public void printVocabulary(String html){runOnUiThread(()->{try{if(printWeb!=null)printWeb.destroy();printWeb=new WebView(MainActivity.this);printWeb.setWebViewClient(new WebViewClient(){public void onPageFinished(WebView view,String url){android.print.PrintManager manager=(android.print.PrintManager)getSystemService(Context.PRINT_SERVICE);manager.print("timing 词库",view.createPrintDocumentAdapter("timing-vocabulary"),new android.print.PrintAttributes.Builder().setMediaSize(android.print.PrintAttributes.MediaSize.ISO_A4).build());}});printWeb.loadDataWithBaseURL(null,html,"text/html","UTF-8",null);}catch(Exception e){js("tell('无法打开打印服务，请改用 Word 导出')");}});}
 @JavascriptInterface public void importBackup(){runOnUiThread(()->{Intent i=new Intent("android.intent.action.OPEN_DOCUMENT");i.setType("*/*");i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,11);});}
 }
 protected void onActivityResult(int req,int result,Intent data){super.onActivityResult(req,result,data);if(req==13){if(result==RESULT_OK&&data!=null){java.util.List<Uri> photos=new java.util.ArrayList<>();ClipData picked=data.getClipData();if(picked!=null){for(int i=0;i<Math.min(picked.getItemCount(),journalPhotoLimit);i++){Uri uri=picked.getItemAt(i).getUri();if(uri!=null&&!photos.contains(uri))photos.add(uri);}}else if(data.getData()!=null)photos.add(data.getData());readJournalPhotos(photos);if(picked!=null&&picked.getItemCount()>journalPhotoLimit)js("tell('已添加可容纳的照片，单条最多 20 张')");}else js("receiveJournalPhoto(null)");return;}if(result!=RESULT_OK||data==null){exportBytes=null;js("tell('')");return;}try{if(req==12){try(OutputStream out=getContentResolver().openOutputStream(data.getData())){out.write(exportBytes);}exportBytes=null;js("tell('文档已保存')");}else if(req==10){OutputStream out=getContentResolver().openOutputStream(data.getData());out.write(backup.getBytes("UTF-8"));out.close();js("tell('备份已保存')");}else if(req==11){InputStream in=getContentResolver().openInputStream(data.getData());ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buf=new byte[4096];int n;while((n=in.read(buf))!=-1){out.write(buf,0,n);if(out.size()>10000000)throw new IOException("File too large");}in.close();String name="import.txt";try(android.database.Cursor cursor=getContentResolver().query(data.getData(),null,null,null,null)){if(cursor!=null&&cursor.moveToFirst()){int idx=cursor.getColumnIndex("_display_name");if(idx>=0)name=cursor.getString(idx);}}js("receiveDocument("+JSONObject.quote(android.util.Base64.encodeToString(out.toByteArray(),2))+","+JSONObject.quote(name)+")");}}catch(Exception e){js("tell('文件操作失败，请选择小于 10 MB 的支持格式文件')");}}
 public void onBackPressed(){js("handleBack()");}
 void js(String code){runOnUiThread(()->web.evaluateJavascript(code,null));}
 protected void onPause(){js("studyFocused=false;studyStamp=Date.now()");super.onPause();}
 protected void onResume(){super.onResume();if(web!=null)js("studyFocused=true;studyStamp=Date.now();lastStudyAction=0");}
}

