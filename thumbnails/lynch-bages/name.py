import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
S = Path(sys.argv[1]); F = S/"fonts"; OUT = S/"out"
DARK=(52,48,44)
f = ImageFont.truetype(str(F/"CormorantGaramond%5Bwght%5D.ttf"), 80); f.set_variation_by_axes([600])
im=Image.new("RGBA",(1200,200),(0,0,0,0))
ImageDraw.Draw(im).text((600,100),"Jean-Charles Cazes",font=f,fill=DARK+(255,),anchor="mm")
im=im.crop(im.getbbox()); im.save(OUT/"layer_name.png"); print(im.size)
# preview with the new layout (1x coords)
L={"bg":("layer_background.png",0,0,1280,720),"avu":("layer_avu_logo.png",225,45,150,141),
   "title":("layer_title.png",48,214,504,280),"name":("layer_name.png",None,508,None,None),
   "lb":("layer_lynch_bages_logo.png",175,562,250,95)}
comp=Image.new("RGBA",(2560,1440))
for k,(fn,x,y,w,h) in L.items():
    l=Image.open(OUT/fn).convert("RGBA")
    if w is None: w,h=l.width//2,l.height//2; x=300-w//2; print("name@1x",x,y,w,h)
    comp.alpha_composite(l.resize((w*2,h*2),Image.LANCZOS),(x*2,y*2))
comp.convert("RGB").resize((1280,720),Image.LANCZOS).save(OUT/"thumbnail_with_name.jpg",quality=95)
