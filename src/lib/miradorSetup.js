

let jQ,extendedPresets,sortLangScriptLabels

let importModules = async () => {
   try {
      const val = await require("jquery")
      console.log("jQ",val)
      jQ = val //.default

      require(['./transliterators.js'],(module) => {
         sortLangScriptLabels = module.sortLangScriptLabels
         extendedPresets = module.extendedPresets ;
      });
   }
   catch(e)
   {
      jQ = window.jQuery
   }


}
importModules();



let timerConf, scrollTimer, scrollTimer2, clickTimer


export function miradorSetUI(closeCollec)
{
   if(closeCollec == undefined) closeCollec = true
   if(!jQ) importModules()

   clearInterval(scrollTimer)
   clearInterval(scrollTimer2)
   clearInterval(clickTimer)
   clearInterval(timerConf)
   timerConf = setInterval( () => {

      console.log("miraconf...",window.maxW)

      jQ(".user-buttons.mirador-main-menu span.fa-bars").removeClass("fa-bars").addClass("fa-list");

      miradorAddZoomer();

      jQ("#collection-tree li.jstree-node").click( (e) => {
         console.log("jstree")
         //$(e.target).closest("li").addClass("added-click");

         miradorSetUI(false);
      })


      if(jQ(".scroll-view li").length && !jQ("#manifest-select-menu").is(':visible')) {

         jQ(".mirador-container .mirador-main-menu li a").addClass('on');
         jQ(".mirador-container .mirador-main-menu li:nth-child(1) a").addClass('selec');

         console.log("ici")

         miradorAddZoom();
         miradorAddScroll();

         clearInterval(scrollTimer2)
         scrollTimer2 = setInterval( () => {

            if(jQ(".scroll-view").length)
            {
               clearInterval(timerConf)
               clearInterval(scrollTimer2)
               setTimeout( () => {

                  console.log(jQ(".mirador-container ul.scroll-listing-thumbs ").width(),jQ(window).width())
                  jQ(".scroll-view")
                  .scrollLeft((jQ(".mirador-container ul.scroll-listing-thumbs ").width() - jQ(window).width()) / 2)
                  .scrollTop(jQ(".scroll-view").scrollTop()+1)

                  miradorInitMenu()


               }, 100);
            }
         }, 100);
      }
      else if(jQ(".mirador-viewer .member-select-results li[data-index-number=0]").length)
      {
         jQ(".mirador-container .mirador-main-menu li a").removeClass('on');
         jQ(".mirador-container .mirador-main-menu li:nth-child(1) a").addClass('on selec');

         clearInterval(timerConf);

         miradorAddClick();
         window.setMiradorClick(closeCollec);

         miradorAddZoom();
         miradorAddScroll();



         // open first volume ? or not
         //jQ(".mirador-viewer .member-select-results li[data-index-number=0]").click()
         //jQ('.mirador-viewer li.scroll-option').click()

      }

   }, 350 )
}

export function miradorConfig(data, manifest, canvasID)
{
   let _extendedPresets = extendedPresets
   if(!_extendedPresets) _extendedPresets = window.extendedPresets
   let _sortLangScriptLabels = sortLangScriptLabels
   if(!_sortLangScriptLabels) _sortLangScriptLabels = window.sortLangScriptLabels

   let config = {
      id:"viewer",
      data: [],
      showAddFromURLBox:false,
      //displayLayout:false,

      manifestsPanel: {
        name: "Collection Tree Manifests Panel",
        module: "CollectionTreeManifestsPanel",
        options: {
            labelToString: (labels) => {

               // dont assume bo-x-ewts on unlocalized labels...
               // if(typeof labels == "string") labels = [ { "@value": labels, "@language":"bo-x-ewts" } ]
               if(typeof labels == "string") return labels

               let langs = _extendedPresets([ "bo", "zh-hans" ])
               let sortLabels = _sortLangScriptLabels(labels,langs.flat,langs.translit)
               let label = sortLabels[0]
               if(label["@value"]) return label["@value"] //+"@"+label["@language"]
               if(label["value"]) return label["value"]  //+"@"+label["language"]
               else return label

               /*
               if(Array.isArray(label)) return label.map( e => (e["@value"]?e["@value"]+"@"+e["@language"]:e)).join("; ")
               else if(label["@value"]) return label["@value"]+"@"+label["@language"]
               else if(label["value"]) return label["value"]+"@"+label["language"]
               else return label
               */

            }
        }
      },
      windowSettings: {
        sidePanelVisible: false
      },

      mainMenuSettings : {
         "buttons":[{"layout":"false"}],
         "userButtons": [
           { "label": "Reading View",
             "iconClass": "fa fa-align-center",
             "attributes" : { style:"", onClick : "eval('window.setMiradorScroll()')" }
          },
           { "label": " ",
             "iconClass": "fa fa-search",
             "attributes" : { "title":"Adjust zoom level" }
          },
           { "label": "Page View",
             "iconClass": "fa fa-file-o",
             "attributes" : { style:"", onClick : "eval('window.setMiradorZoom()')" }
          },
           { "label": "Close Mirador",
             "iconClass": "fa fa-times",
             "attributes" : { onClick : "javascript:eval('window.closeViewer()')" }
            }
         ]
      }
   }
   if(!manifest) {

      config["openManifestsPage"] = true
      config["preserveManifestOrder"] = true
      config["windowObjects"] = []

      config["mainMenuSettings"]["userButtons"] =
      [
         {
            "label": "Browse Collection",
            "iconClass": "fa fa-bars",
            "attributes" : {
               onClick : "if(window.setMiradorClick) { window.setMiradorClick(event); }"
            },
         },
         ...config["mainMenuSettings"]["userButtons"]
      ]
   }
   else {
      config["windowObjects"] = [ {
         loadedManifest: manifest, //(this.props.collecManif?this.props.collecManif+"?continuous=true":this.props.imageAsset+"?continuous=true"),
         canvasID: canvasID,
         viewType: "ScrollView",
         availableViews: [ 'ImageView', 'ScrollView' ],
         displayLayout:false
      } ]
   }
   config.data = data

   return config ;
}

function miradorAddClick(firstInit){
   if(!window.setMiradorClick) {

      window.setMiradorClick = (firstInit,e) => {

         console.log("cliked",e,firstInit)

         if(jQ(".mirador-container .mirador-main-menu li:nth-child(1) a").hasClass('selec')) {
            if(e) {
               e.stopPropagation()
               return ;
            }
         }

         jQ(".mirador-container .mirador-main-menu li a").removeClass('selec');
         jQ(".mirador-container .mirador-main-menu li:nth-child(1) a").addClass('selec');

         let elem = jQ('.workspace-container > div > div > div.window > div.manifest-info > a.mirador-btn.mirador-icon-window-menu > ul > li.new-object-option > i') //,.addItemLink').first().click() ;
         if(firstInit) elem.first().click()

         clearInterval(clickTimer);
         clickTimer = setInterval(() => {
            console.log("click interval")
            let added = false
            jQ(".mirador-viewer .member-select-results li[data-index-number]").each( (i,e) => {
               let item = jQ(e)
               if(!item.hasClass("setClick")) {

                  item.addClass("setClick");


                  item.find(".preview-image").click( (e) => {
                     /*
                     miradorInitMenu()

                     jQ(".mirador-container .mirador-main-menu li a").removeClass('selec');
                     jQ(".mirador-container .mirador-main-menu li a .fa-file-o").parent().addClass('selec');
                     jQ(".user-buttons.mirador-main-menu").find("li:nth-last-child(3),li:nth-last-child(4)").addClass('off')
                     */
                  //})
                  //item.addClass("setClick").click(() => {

                     miradorInitMenu()

                     //jQ(".mirador-viewer li.scroll-option").click();
                     jQ(".mirador-container .mirador-main-menu li a").removeClass('selec');
                     jQ(".mirador-container .mirador-main-menu li a .fa-align-center").parent().addClass('selec');
                     jQ(".user-buttons.mirador-main-menu li.off").removeClass('off')

                     clearInterval(scrollTimer);
                     scrollTimer = setInterval( () => {

                        if(jQ(".scroll-view").length)
                        {
                           clearInterval(scrollTimer)

                           setTimeout( () => {

                              console.log(jQ(".mirador-container ul.scroll-listing-thumbs ").width(),jQ(window).width())
                              jQ(".scroll-view")
                              .scrollLeft((jQ(".mirador-container ul.scroll-listing-thumbs ").width() - jQ(window).width()) / 2)
                              .scrollTop(jQ(".scroll-view").scrollTop()+1)
                              .find("img.thumbnail-image").click(()=>{
                                 jQ(".mirador-container .mirador-main-menu li a").removeClass('selec');
                                 jQ(".mirador-container .mirador-main-menu li a .fa-file-o").parent().addClass('selec');
                                 jQ(".user-buttons.mirador-main-menu").find("li:nth-last-child(3),li:nth-last-child(4)").addClass('off')
                              })


                           }, 1000);

                        }
                     }, 10);
                  })
                  added = true ;
               }


            })
            if(!added) {
               clearInterval(clickTimer)
            }
         }, 10) ;
      }
   }
}

function miradorAddZoom()
{
   if(!window.setMiradorZoom) {
      window.setMiradorZoom = () => {

         if(jQ(".mirador-container .mirador-main-menu li:nth-child(1) a").hasClass('selec')) {
            let elem = jQ('.workspace-container > div > div > div.window > div.manifest-info > a.mirador-btn.mirador-icon-window-menu > ul > li.new-object-option > i')
            elem.first().click()
         }

         jQ(".mirador-container .mirador-main-menu li a").removeClass('selec');
         jQ(".mirador-container .mirador-main-menu li a .fa-file-o").parent().addClass('selec');
         jQ(".user-buttons.mirador-main-menu").find("li:nth-last-child(3),li:nth-last-child(4)").addClass('off')

         let found = false
         jQ('.scroll-view > ul > li').each((i,e) => {
            let item = jQ(e)
            let o = item.offset()
            if(o.top > 0 && !found) {
               item.find("img").click()
               found = true;
            }
         })
      }
   }
}

function miradorAddScroll()
{
   if(!window.setMiradorScroll) {
      window.setMiradorScroll = () => {

         if(jQ(".mirador-container .mirador-main-menu li:nth-child(1) a").hasClass('selec')) {
            let elem = jQ('.workspace-container > div > div > div.window > div.manifest-info > a.mirador-btn.mirador-icon-window-menu > ul > li.new-object-option > i')
            elem.first().click()
         }

         jQ(".mirador-container .mirador-main-menu li a").removeClass('selec');
         jQ(".mirador-container .mirador-main-menu li a .fa-align-center").parent().addClass('selec');
         jQ(".user-buttons.mirador-main-menu li.off").removeClass('off')

         setTimeout(() => {
            let id = jQ(".panel-listing-thumbs li.highlight img").first()
            console.log("id?",id.length,id)

            jQ(".mirador-viewer li.scroll-option").click();

            let sT = jQ(".scroll-view").scrollTop()
            if(!sT) sT = 0

            let im
            if(id) im = jQ(".scroll-view img[data-image-id='"+id.attr("data-image-id")+"']").first()
            else im = jQ(".scroll-view img[data-image-id]").first()

            let imgY = 0 ;
            if(id) imgY = im.parent().offset().top
            console.log("y",sT,imgY,im)

            jQ(".scroll-view").animate({scrollTop:sT+imgY-100}
               //,"scrollLeft": (jQ(".mirador-container ul.scroll-listing-thumbs ").width() - jQ(window).width()) / 2}
               ,100, () => { jQ("input#zoomer").trigger("input") })


            jQ(".scroll-view img.thumbnail-image").click(()=>{
               jQ(".mirador-container .mirador-main-menu li a").removeClass('selec');
               jQ(".mirador-container .mirador-main-menu li a .fa-file-o").parent().addClass('selec');
               jQ(".user-buttons.mirador-main-menu").find("li:nth-last-child(3),li:nth-last-child(4)").addClass('off')
            })

         }, 250)
       }
   }
}

function miradorAddZoomer() {

   if(!jQ(".mirador-main-menu #zoomer").length) {

      jQ(".user-buttons.mirador-main-menu li:nth-last-child(2)")
      .before('<li><input title="Adjust zoom level" oninput="javascript:eval(\'window.setZoom(this.value)\');" type="range" min="0" max="1" step="0.01" value="0" id="zoomer"/></li>')

      window.setZoom = (val) => {

         console.log("sZ",window.max)

         if(!window.maxW) miradorInitMenu(true)
         if(!window.maxW) return ;

         let scrollT = jQ(".mirador-container ul.scroll-listing-thumbs")
         let scrollV = jQ(".scroll-view")

         // val = 1 => w =  1 * W
         // val = 0 => w =  x * W <=> x = dMin

         let dMin = scrollV.innerWidth() / window.maxW
         let coef = 1 - (1 - dMin) * (1 - val)

         let oldH = scrollT[0].getBoundingClientRect().height;

         scrollT.css({"transform":"scale("+coef+")"})
         scrollV.scrollLeft((window.maxW*coef - scrollV.innerWidth() + 20) / 2)

         let nuH = scrollT[0].getBoundingClientRect().height;

         let sT = scrollV.scrollTop() + (nuH - oldH)*(scrollV.scrollTop()/oldH)
         scrollV.scrollTop(sT)

         //scrollT.css({"height":nuH}) // ok but then zoom bugs... TODO

         console.log("h",sT,oldH,nuH)


      }

   }
}


function miradorInitMenu(maxWonly) {

   if(maxWonly == undefined) maxWonly = false

   console.log("maxWo",maxWonly)

   if(!maxWonly) jQ(".user-buttons.mirador-main-menu li:nth-last-child(n-5):nth-last-child(n+2)").addClass("on")
   window.maxW = jQ(".mirador-container ul.scroll-listing-thumbs ").width()

   console.log("w",jQ(".mirador-container ul.scroll-listing-thumbs ").width())

   if(window.maxW < jQ(".scroll-view").innerWidth())
   {
      window.maxW = 0
      if(!maxWonly)  {
         jQ(".mirador-container ul.scroll-listing-thumbs ").css("width","auto");
         jQ(".user-buttons.mirador-main-menu").find("li:nth-last-child(3),li:nth-last-child(4)").removeClass("on").hide()
      }
   }
   if(!maxWonly) jQ("input#zoomer").trigger("input")

   console.log("maxW",window.maxW)
}

export async function miradorInitView(props) {

   const bdr = "http://purl.bdrc.io/resource/"

   let data = [
      { "collectionUri": "tibcolldemo2.json", location: "BDRC - Palpung Collection"}
   ]
   const urlParams = new URLSearchParams(window.location.search);
   const work = props.match.params.IRI;
   if(work) {
      console.log("work",work)

      const resData = await(await fetch("http://purl.bdrc.io/graph/Resgraph?I_LIM=500&R_RES="+work+"&format=jsonld")).json()
      console.log(resData)

      let propK ;
      if(resData.status && resData.status == 404) { console.log("echec",work)}
      else if(resData["@graph"]) propK = resData["@graph"].filter(d => d["@id"] == work)[0]
      else propK = resData
      console.log("pK",propK)
      if(propK)
      {
         if(propK["workHasItemImageAsset"] || propK["workLocation"]) { //workHasItemImageAsset

            const item = propK["workHasItemImageAsset"]?propK["workHasItemImageAsset"]:propK["workLocation"]

            let assocData = await(await fetch("http://purl.bdrc.io/query/IIIFView-workInfo?R_RES="+work+"&format=json")).json()
            if(assocData && assocData.results && assocData.results.bindings)
              assocData = assocData.results.bindings
            console.log(assocData)

            let hasParts = assocData.filter(e => e.hasParts)[0]
            if(hasParts && hasParts["hasParts"] && hasParts["hasParts"].value) hasParts = hasParts["hasParts"].value === "true"
            let nbVol = assocData.filter(e => e.nbVolumes)[0]
            if(nbVol && nbVol["nbVolumes"] && nbVol["nbVolumes"].value) nbVol = Number(nbVol["nbVolumes"].value)

            console.log(nbVol,hasParts)

            if( hasParts == true || nbVol > 1 ) {
               data = [
                  { "collectionUri" : "http://iiifpres.bdrc.io"+"/2.1.1/collection/wio:"+work, location:"" }
               ]
            }
            else {
               data = [
                  { "manifestUri" : "http://iiifpres.bdrc.io"+"/2.1.1/wv:"+work+"/manifest", location:"" }
               ]
            }
         } else if(propK["imageList"]) {
            data = [
               { "manifestUri" : "http://iiifpres.bdrc.io"+"/2.1.1/v:"+work+"/manifest", location:"" }
            ]
         } else if(propK["hasIIIFManifest"]) {
            data = [
               { "manifestUri" : propK["hasIIIFManifest"]["@id"], location:"" }
            ]
         }
      }
   }

   let manif = data.filter(e => e.manifestUri)[0]
   if(manif && manif.manifestUri) manif = manif.manifestUri
   console.log("data",data,manif)

   let config = miradorConfig(data,manif);

   let initTimer = setInterval( ((cfg) => () => {
      console.log("init?",cfg,window.Mirador)
      if(window.Mirador !== undefined) {
         clearInterval(initTimer);
         window.Mirador( cfg )
         miradorSetUI();
      }
   })(config), 1000)
}


window.miradorConfig = miradorConfig
window.miradorSetUI  = miradorSetUI
