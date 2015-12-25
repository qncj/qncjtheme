/**
 * @file ${FILE_NAME}. Created by PhpStorm.
 * @desc ${FILE_NAME}.
 *
 * @author yangjunbao
 * @since 15/10/29 上午10:31
 * @version 1.0.0
 */
// 页面js文件
$(function () {
    var $mAddCart = $('#m-add-cart'),
        foodId = $mAddCart.data('id'),
        $num = $mAddCart.find('.food-num-val');
    $mAddCart.on('tap', 'input', function () {
        _.addCart(foodId, +$num.html());
    }).on('tap', '.icon-subtract', function () {
        $num.html(+$num.html() - 1 || 1);
    }).on('tap', '.icon-add', function () {
        $num.html(+$num.html() + 1);
    })
});