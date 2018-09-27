// update entities which has 5 ratings
SET SQL_SAFE_UPDATES = 0;
update entity e
inner join (
 select rev.entity_id
	, SUM(rev.rating) rating
	, COUNT(rev.review_id) reviewer_count
 from review rev
 where rev.entity_id > 0
 group by
 rev.entity_id
) as r
on e.entity_id = r.entity_id
set e.overall_rating = r.rating/r.reviewer_count
where e.entity_id > 0 && r.rating >= 0 && r.reviewer_count>0;
SET SQL_SAFE_UPDATES = 1;
select overall_rating from entity order by overall_rating desc;