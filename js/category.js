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
    // init
    var $module = $('#m-category'),
        $fix = $module.children('.fix-lists'),
        $catListWrapper = $('.cate-list'),
        $catList = $catListWrapper.children(),
        $catItems = $catList.children(),
        $lists = $('.food-lists'),
        $listItems = $lists.children(),
        $curCatItem,
        curIndex = 0,
        curItem,
        prevIndex = 0,
        $fixedCate = $('.fixed-cate'),
        $fixedCateTitle = $fixedCate.find('.food-list-title'),
        $window = $(window),
        top,
        titleHeight = 34,
        catItemHeight = 45,
        lists = [],
        next = 0,
        toScroll,
        catTop,
        catHeight = $catListWrapper.height() - 44 - 50,
        i = 0;
    $fix.css('min-height', $lists.height());
    $listItems.each(function (idx) {
        top = idx === 0 ? 0 : (lists[idx - 1].top + next);
        next = $(this).height();
        lists.push({
            top: top,
            title: $(this).children('.food-list-title').html(),
            height: next
        })
    });
    function setPos(pos) {
        $curCatItem && $curCatItem.removeClass('active');
        $curCatItem = $catItems.eq(pos).addClass('active');
        top = $catList.position().top;
        catTop = top + pos * catItemHeight;
        if (catTop > catHeight - catItemHeight) {
            $catList.smoothScrollTo(-(pos + 1) * catItemHeight + catHeight, 50);
        } else if (catTop < 0) {
            $catList.smoothScrollTo(-pos * catItemHeight, 50);
        }
        // $fixedCate.css('top', '44px');
        $fixedCateTitle.html(lists[pos].title);
    }

    function getCurrentItem(top) {
        top = Math.max(top, 0);
        for (i = 0; i < lists.length; i++)
            if (lists[i].top > top || (i === lists.length - 1 && (i += 1)))
                return {
                    index: i - 1,
                    top: lists[i - 1].top,
                    title: lists[i - 1].title,
                    height: lists[i - 1].height
                }
    }

    setPos(0);
    $catList.on('click', 'li', function () {
        curIndex = $(this).index();
        window.scrollTo(0, lists[curIndex].top);
        setPos(curIndex);
    });
    $catList.scroller();
    $window.on('scroll', function () {
        top = $window.scrollTop();
        curItem = getCurrentItem(top);
        if (false && curItem.top + curItem.height - top <= titleHeight) {
            $fixedCate.css('top', (curItem.top + curItem.height - top) + 'px');
        }
        if (curItem.index != prevIndex) {
            setPos(curItem.index);
        }
        prevIndex = curItem.index;
    });
    window.scrollBy(0, 0);
});