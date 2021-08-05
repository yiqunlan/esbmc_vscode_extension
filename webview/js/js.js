/* Acknowledge:This js code is modified from esbmc's web interface
*  Link: http://18.225.0.33/esbmc.php
*/
window.time_between_run_and_output=500; // 500 Millisecond
window.time_between_stop_and_new_run=2000;

window.run_id=0;
//Import vscode Apis
const vscode = acquireVsCodeApi();

function my_clor()
{
    //Highlight checked parameters
    var chks=document.getElementsByTagName('input');
    for(i=0;i<chks.length;i++)
    {
        if(chks[i].type==='checkbox')
        {
            if(chks[i].checked===true)
                chks[i].parentElement.style.backgroundColor='#9c9c9c';
            else
                chks[i].parentElement.style.backgroundColor='#1E1E1E';
        }
    }

    //Highlight filled input
    var txts=document.getElementsByTagName('input');
    for(i=0;i<txts.length;i++)
    {
        if(txts[i].type==='text' || txts[i].type==='number')
        {
            if(txts[i].value !=='')
                txts[i].style.backgroundColor='#9c9c9c';
            else
                txts[i].style.backgroundColor='#505050';
        }	
    }
};

//Add selected val parameter into post command 
function add_to_post(ctrl,pst)
{
    var val=document.getElementsByName(ctrl)[0].value;
    if(val!=""&&val.trim()!="")
        pst+='--'+ctrl+' '+val.replace(/\s/g,"")+' ';

    return pst;
}

//function sleep time
function sleep(time)
{
    return new Promise((resolve)=>setTimeout(resolve,time));
}
function my_run(e)
{
    e.preventDefault();

    //update color of current view
    my_clor();

    window.run_id++;
    // window.jtxtcode=window.jtxtcode||jQuery('#txtcode');
    // if(window.jtxtcode.val().trim()=="")
    // {
    //     alert('Please write your sourcecode.');
    //     return;
    // }

    window.jtxtresult=window.jtxtresult||jQuery('#txtresult');
    window.jtxtresult.val('');
    //Move to result panel
    jQuery([document.documentElement,document.body]).animate({
        scrollTop:window.jtxtresult.offset().top},2000);
    
    // instead of object, I chose string to keep it simple.
    // var s={action:'run',code:window.jtxtcode.val(),type:jQuery('#dl_code').children("option:selected").val()};
    var s = ""
    //get all checkboxes
    var chks=document.getElementsByTagName('input');
    for(i=0;i<chks.length;i++)
    {
        if(chks[i].type==='checkbox' && chks[i].checked===true)
        {
            var ch=chks[i];
            s+=ch.name+' ';
        }
    }
    s = add_to_post('function',s);
    s = add_to_post('claim',s);
    s = add_to_post('depth',s);
    s = add_to_post('unwind',s);
    s = add_to_post('unwindset',s);
    s = add_to_post('k-step',s);
    s = add_to_post('max-k-step',s);
    s = add_to_post('error-label',s);
    s = add_to_post('k-step',s);
    s = add_to_post('max-k-step',s);
    s = add_to_post('time-slice',s);
    s = add_to_post('context-bound',s);
    s['word_size']=jQuery('input[name="word_size"]:checked').val();

    start_anim()

    console.log(s);
    vscode.postMessage({
        command:'run',
        text:s
    });

    /*jQuery.ajax({url:"code_run.php",
        success:function(result)
        {
            //console.log(result);
            //if(result['success']==1)
            //{
                //my_out();
            //}
            //else
            if(result['success']==0)
            {
                var msg="";
                for(var i=0;i<result['err'].length;i++) msg+=result['err'][i]+'\n';
                alert(msg);
            }
        },
        async:true,
        //contentType:'',
        data:s,
        dataType:'json',
        type:'post',
        error:function(xhr,status,error)
        {
            alert('Error');
            jQuery('button[name="btnrun"]').each(function()
            {
                var btn=jQuery(this);
                btn.prop('disabled',false);
                btn.removeClass('btn_disabled').addClass('btn_run_enabled');
            });
            jQuery('button[name="btnstop"]').each(function()
            {
                var btn=jQuery(this);
                btn.prop('disabled',true);
                btn.removeClass('btn_stop_enabled').addClass('btn_disabled');
            });
            jQuery('div[name="dvloader"]').each(function()
            {
                var dv=jQuery(this);
                dv.removeClass('loader_ani');
            });
        },
    });*/




    // sleep(window.time_between_run_and_output).then(()=>{
    //     my_out(window.run_id);
    // });
	
}
function start_anim(){
    jQuery('button[name="btnrun"]').removeClass('btn_run_enabled').addClass('btn_disabled').prop('disabled',true);
    jQuery('button[name="btnstop"]').removeClass('btn_disabled').addClass('btn_stop_enabled').prop('disabled',false);
    jQuery('div[name="dvloader"]').addClass('loader_ani');
}

function my_stop(e)
{
    e.preventDefault();

    jQuery('button[name="btnrun"]').removeClass('btn_disabled').addClass('btn_run_enabled').prop('disabled',false);
    jQuery('button[name="btnstop"]').prop('disabled',true).removeClass('btn_stop_enabled').addClass('btn_disabled');
    jQuery('div[name="dvloader"]').removeClass('loader_ani');

    // var s={action:'stop'};
    // jQuery.ajax({url:"code_stop.php",
    //     success:function(result){

    //     },
    //     async:true,
    //     //contentType:'',
    //     data:s,
    //     dataType:'json',
    //     type:'post',
    //     error:function(xhr,status,error){},
    // });
}
// function my_out(p_id)
// {
//     var s={action:'out'};
//     jQuery.ajax({url:"code_out.php",
//         success:function(result)
//         {
//             if(p_id!=window.run_id)return;
//             if(result['success']==1)
//             {
//                 window.jtxtresult=window.jtxtresult||jQuery('#txtresult');
//                 //out=result['out'];
//                 window.jtxtresult.val(window.jtxtresult.val()+result['out']);
//                 window.jtxtresult.scrollTop(window.jtxtresult[0].scrollHeight - window.jtxtresult.height());
//                 if(result['must_continue']==1)
//                     my_out(p_id);
//                 else
//                 {
//                     jQuery('button[name="btnrun"]').removeClass('btn_disabled').addClass('btn_run_enabled').prop('disabled',false);
//                     jQuery('button[name="btnstop"]').prop('disabled',true).removeClass('btn_stop_enabled').addClass('btn_disabled');
//                     jQuery('div[name="dvloader"]').removeClass('loader_ani');
//                 }
//             }
//         },
//         async:true,
//         //contentType:'',
//         data:s,
//         dataType:'json',
//         type:'post',
//         error:function(xhr,status,error)
//         {
//             jQuery('button[name="btnrun"]').removeClass('btn_disabled').addClass('btn_run_enabled').prop('disabled',false);
//             jQuery('button[name="btnstop"]').prop('disabled',true).removeClass('btn_stop_enabled').addClass('btn_disabled');
//             jQuery('div[name="dvloader"]').removeClass('loader_ani');
//             //console.log(error);
//             //console.log(status);
//             alert('Unknown Error:'+error);

//         },
//     });
// }



function setInputFilter(tb,fn)
{
    ["input","keydown","keyup","mousedown","mouseup","select","contextmenu","drop"].forEach(function(e){tb.addEventListener(e,
        function(){
            if(fn(this.value))
            {
                this.ov=this.value;
                //this.oss=this.selectionStart;
                //this.oldSelectionEnd=this.selectionEnd;
            }
            else
            {
                if(this.hasOwnProperty("ov"))
                {
                    this.value=this.ov;
                    //this.setSelectionRange(this.oss,this.ose);
                }
        }
        });});
}

function gn(nm){return document.getElementsByName(nm);}
jQuery(document).ready(function()
{
    setInputFilter(gn("function")[0],function(v){
        var pattern=new RegExp("^[a-zA-Z0-9_]+$");
        return v==""||pattern.test(v);});

    setInputFilter(gn("claim")[0],function(v){
        var pattern=new RegExp("^[0-9]*$");
        return v==""||pattern.test(v);});

    setInputFilter(gn("depth")[0],function(v){
        var pattern=new RegExp("^[0-9]*$");
        return v==""||pattern.test(v);});

    /*setInputFilter(gn("unwind")[0],function(v){
            var pattern=new RegExp("^[0-9]*$");
            return v==""||pattern.test(v);});
    */
   jQuery('input[name="unwind"]').on('change keyup', function() {
       var sanitized = $(this).val().replace(/[^-.0-9]/g, '');
       //sanitized = sanitized.replace(/(.)-+/g, '$1');
       //sanitized = sanitized.replace(/\.(?=.*\.)/g, '');
       jQuery(this).val(sanitized);
  });

    /*setInputFilter(gn("unwind")[0],function(v){
            var pattern=new RegExp("^[0-9]*$");
            return v==""||pattern.test(v);});*/

    setInputFilter(gn("unwindset")[0],function(v){
        var pattern=new RegExp("^[0-9]*$");
        return v==""||pattern.test(v);});

    setInputFilter(gn("k-step")[0],function(v){
        var pattern=new RegExp("^[0-9]*$");
        return v==""||pattern.test(v);});

    setInputFilter(gn("max-k-step")[0],function(v){
        var pattern=new RegExp("^[0-9]*$");
        return v==""||pattern.test(v);});

    setInputFilter(gn("error-label")[0],function(v){
        var pattern=new RegExp("^[a-zA-Z0-9_]*$");
        return v==""||pattern.test(v);});

    setInputFilter(gn("k-step")[0],function(v){
        var pattern=new RegExp("^[0-9]*$");
        return v==""||pattern.test(v);});

    setInputFilter(gn("max-k-step")[0],function(v){
        var pattern=new RegExp("^[0-9]*$");
        return v==""||pattern.test(v);});

    setInputFilter(gn("time-slice")[0],function(v){
        var pattern=new RegExp("^[0-9]*$");
        return v==""||pattern.test(v);});

    setInputFilter(gn("context-bound")[0],function(v){
        var pattern=new RegExp("^[0-9]*$");
        return v==""||pattern.test(v);});

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'showResult':
                window.jtxtresult=window.jtxtresult||jQuery('#txtresult');
                window.jtxtresult.val(message.text);
                my_stop(event);
                break;
            case 'runDefault':
                start_anim();
                break;
        }
    });
});