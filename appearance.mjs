export const nightPalettes={
 forest:{surface:'#181622',panel:'#292438',glow:'#61457e',accent:'#c0a1e0',tint:'#4b365f',ink:'#f4eafa',wash:'#34293f'},
 blue:{surface:'#101c29',panel:'#1c3042',glow:'#315b7c',accent:'#8dc6ec',tint:'#294c65',ink:'#e8f5ff',wash:'#20374b'},
 apricot:{surface:'#251a14',panel:'#39291f',glow:'#845d39',accent:'#e9ba83',tint:'#61462e',ink:'#fff1df',wash:'#483323'},
 rose:{surface:'#24151d',panel:'#392430',glow:'#80455f',accent:'#e7a7c3',tint:'#60364c',ink:'#ffecf4',wash:'#482b3c'},
 sage:{surface:'#15211c',panel:'#25392e',glow:'#496f54',accent:'#a9d2ad',tint:'#385b43',ink:'#edf9ed',wash:'#2c4535'}
};
export function applyAppearance(body,palette,mode){const selected=nightPalettes[palette]?palette:'forest';body.dataset.palette=selected;body.dataset.theme=mode==='night'?'night':selected;body.dataset.background=mode==='night'?'night':'soft';for(const key of ['surface','panel','glow','accent','tint','ink','wash']){if(mode==='night')body.style.setProperty('--'+key,nightPalettes[selected][key]);else body.style.removeProperty('--'+key);}}
