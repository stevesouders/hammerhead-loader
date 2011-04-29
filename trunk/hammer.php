<?php
$gUrl = "about:blank";
if ( array_key_exists('u', $_GET) ) {
	$gUrl = $_GET['u'];
}
?>
<html>
<head>
<title>Loader</title>
</head>
<frameset rows="80,*" border=0>
  <frame src="data:text/html,%3Chtml%3E%3Cbody%20style%3D%22background%3A%20black%3B%20font-family%3A%20%27Trebuchet%20MS%27%3B%20font-size%3A%2032pt%3B%22%3E%3Cdiv%20style%3D%22float%3A%20right%3B%22%3E%3Cimg%20src%3D%22http%3A//stevesouders.com/hammerhead/icon-52x52.png%22%20width%3D52%20height%3D52%3E%3C/div%3E%3Ca%20target%3D%22_blank%22%20href%3D%22http%3A//stevesouders.com/hammerhead/%22%20style%3D%22text-decoration%3A%20none%3B%20color%3A%20%23AAA%22%3EHammerHead%3C/a%3E%3C/body%3E%3C/html%3E"></frame>
  <frame src="<?php echo $gUrl ?>"></frame>
</frameset>
</html>
