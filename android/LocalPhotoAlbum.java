package app.wordloom.vocabulary;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentUris;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.net.Uri;
import android.provider.MediaStore;
import android.util.LruCache;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.FrameLayout;
import android.widget.GridView;
import android.widget.ImageView;
import android.widget.TextView;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Album fallback for Android builds without a system multi-photo picker. */
final class LocalPhotoAlbum {
    interface Selection { void complete(List<Uri> photos); }

    static void show(Activity owner, int limit, Selection callback) {
        Uri collection=MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
        List<Long> ids=new ArrayList<>();
        try(Cursor cursor=owner.getContentResolver().query(collection,new String[]{MediaStore.Images.Media._ID},null,null,MediaStore.Images.Media.DATE_ADDED+" DESC")){
            if(cursor!=null)while(cursor.moveToNext())ids.add(cursor.getLong(0));
        }catch(RuntimeException unavailable){callback.complete(new ArrayList<>());return;}
        final LinkedHashSet<Long> chosen=new LinkedHashSet<>();
        final HashSet<Long> loading=new HashSet<>();
        GridView grid=new GridView(owner);grid.setNumColumns(3);grid.setVerticalSpacing(6);grid.setHorizontalSpacing(6);grid.setPadding(12,12,12,12);
        int cell=Math.max(90,(owner.getResources().getDisplayMetrics().widthPixels-140)/3);
        ExecutorService thumbnails=Executors.newFixedThreadPool(2);
        LruCache<Long,Bitmap> cache=new LruCache<>(60);
        BaseAdapter adapter=new BaseAdapter(){
            @Override public int getCount(){return ids.size();}
            @Override public Object getItem(int i){return ids.get(i);}
            @Override public long getItemId(int i){return ids.get(i);}
            @Override public View getView(int i,View recycled,ViewGroup parent){
                long id=ids.get(i);
                FrameLayout item=recycled==null?new FrameLayout(owner):(FrameLayout)recycled;
                if(recycled==null){
                    item.setLayoutParams(new GridView.LayoutParams(cell,cell));
                    ImageView image=new ImageView(owner);image.setScaleType(ImageView.ScaleType.CENTER_CROP);image.setBackgroundColor(0xff282432);item.addView(image,new FrameLayout.LayoutParams(-1,-1));
                    TextView tick=new TextView(owner);tick.setText("✓");tick.setTextColor(0xffffffff);tick.setBackgroundColor(0xff655580);tick.setGravity(Gravity.CENTER);
                    FrameLayout.LayoutParams marker=new FrameLayout.LayoutParams(28,28,Gravity.TOP|Gravity.RIGHT);item.addView(tick,marker);
                }
                ((ImageView)item.getChildAt(0)).setImageBitmap(cache.get(id));
                item.getChildAt(1).setVisibility(chosen.contains(id)?View.VISIBLE:View.INVISIBLE);
                item.setContentDescription("照片 "+(i+1)+(chosen.contains(id)?"，已选":""));
                if(cache.get(id)==null&&loading.add(id)&&!thumbnails.isShutdown())thumbnails.execute(()->{
                    Bitmap result=null;try{result=MediaStore.Images.Thumbnails.getThumbnail(owner.getContentResolver(),id,MediaStore.Images.Thumbnails.MINI_KIND,null);}catch(RuntimeException ignored){}
                    final Bitmap thumbnail=result;owner.runOnUiThread(()->{if(thumbnail!=null){loading.remove(id);cache.put(id,thumbnail);notifyDataSetChanged();}});
                });
                return item;
            }
        };
        grid.setAdapter(adapter);
        AlertDialog dialog=new AlertDialog.Builder(owner).setTitle(ids.isEmpty()?"相册里还没有照片":"选择照片（最多 "+limit+" 张）").setView(grid)
            .setNegativeButton("取消",null).setPositiveButton("添加",null).create();
        final boolean[] submitted={false};
        dialog.setOnDismissListener(d->{thumbnails.shutdownNow();if(!submitted[0])callback.complete(new ArrayList<>());});
        grid.setOnItemClickListener((parent,view,index,id)->{if(!chosen.remove(id)&&chosen.size()<limit)chosen.add(id);adapter.notifyDataSetChanged();dialog.getButton(AlertDialog.BUTTON_POSITIVE).setText("添加（"+chosen.size()+"）");dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(!chosen.isEmpty());});
        dialog.show();
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(false);
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(view->{submitted[0]=true;List<Uri> photos=new ArrayList<>();for(long id:chosen)photos.add(ContentUris.withAppendedId(collection,id));callback.complete(photos);dialog.dismiss();});
    }
}
