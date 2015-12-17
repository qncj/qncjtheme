// 页面js文件
$(function () {
    var $usPhoneNum = $('#us-phonenum');
    
	$usPhoneNum.on('click', '.us-tel', function () {
        _.confirm('400-826-1418',null,null,'呼叫','取消');
    })
});